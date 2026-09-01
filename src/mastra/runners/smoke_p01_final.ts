import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { executeFinalRows, writeImmutable } from "../final/execution.js";
import { executeFinalSmokeJudges, type FinalJudgeResult } from "../final/judges.js";
import { FINAL_CASES_PATH, FINAL_JUDGE_CONFIG_PATH, FINAL_MATRIX_PATH, FINAL_PROMPT_PATH, loadFinalCase, loadFinalMatrix, loadFinalSmokeManifest } from "../final/loader.js";
import { renderFinalInput } from "../final/renderer.js";
import type { FinalExecutionRow, FinalTargetResult } from "../final/types.js";
import { resolveProjectPath } from "../lib/paths.js";

const EXPECTED_HASHES = new Map([
  [FINAL_CASES_PATH, "3b0ea7c8e3653656500b6a389d2f68f24ce6b677d3d27d82ebc830507cf64fbe"],
  [FINAL_MATRIX_PATH, "5223b52fde6e56a895b50ce35928d3eb97438732790ad5b1bb7162249511db7a"],
  [FINAL_PROMPT_PATH, "2bdcba68a8a5414645e2ffc9f020a8586e6e6b8841963676581d7803f4e29422"],
  [FINAL_JUDGE_CONFIG_PATH, "b634103fbf1b114a42a42351f594c6eb969e27aef3bcd5d32256de19320412d7"]
]);

function hash(filePath: string): string { return createHash("sha256").update(fs.readFileSync(filePath)).digest("hex"); }
function requiredEnv(name: string): void { if (!process.env[name]) throw new Error(`Required environment variable is absent: ${name}`); }
function bool(value: string): boolean { return value.toLowerCase() === "true"; }

function allocateSmokeNamespace(): { id: string; relativeRoot: string; absoluteRoot: string } {
  const parent = resolveProjectPath("outputs/smoke/P01_FINAL");
  fs.mkdirSync(parent, { recursive: true });
  for (let number = 2; number < 10_000; number += 1) {
    const id = `P01_FINAL_SMOKE_${String(number).padStart(3, "0")}`;
    const absoluteRoot = path.join(parent, id);
    if (fs.existsSync(absoluteRoot)) continue;
    fs.mkdirSync(absoluteRoot, { recursive: false });
    if (fs.readdirSync(absoluteRoot).length !== 0) throw new Error(`New smoke namespace is not empty: ${absoluteRoot}`);
    return { id, relativeRoot: `outputs/smoke/P01_FINAL/${id}`, absoluteRoot };
  }
  throw new Error("Unable to allocate a unique immutable Final smoke namespace.");
}

function maxOverlap(results: FinalTargetResult[]): number {
  const events = results.flatMap((result) => [
    { time: new Date(result.attempt.execution_started_at).valueOf(), delta: 1 },
    { time: new Date(result.attempt.execution_completed_at).valueOf(), delta: -1 }
  ]).sort((a, b) => a.time - b.time || a.delta - b.delta);
  let active = 0;
  let maximum = 0;
  for (const event of events) { active += event.delta; maximum = Math.max(maximum, active); }
  return maximum;
}

const matrix = loadFinalMatrix();
const { manifest, sourceRows } = loadFinalSmokeManifest(matrix);
if (process.env.P01_MAX_OUTPUT_TOKENS !== "8192") throw new Error("Final one-shot smoke requires P01_MAX_OUTPUT_TOKENS=8192.");
for (const name of ["OPENAI_API_KEY", "MOONSHOT_API_KEY", "MOONSHOT_BASE_URL", "LANGFUSE_PUBLIC_KEY", "LANGFUSE_SECRET_KEY", "LANGFUSE_BASE_URL"]) requiredEnv(name);
for (const [filePath, expected] of EXPECTED_HASHES) if (hash(filePath) !== expected) throw new Error(`Frozen artifact hash mismatch: ${filePath}`);

const namespace = allocateSmokeNamespace();
if (!namespace.relativeRoot.startsWith("outputs/smoke/P01_FINAL/") || namespace.relativeRoot.startsWith("outputs/final/P01")) throw new Error("Smoke namespace could collide with production outputs.");
const rows: FinalExecutionRow[] = manifest.map((smoke, index) => ({
  run: sourceRows[index]!, executionRunId: smoke.smoke_run_id, sourceFinalRunId: smoke.source_final_run_id,
  phase: "P01_FINAL_SMOKE", executionNamespace: namespace.id
}));
for (const row of rows) renderFinalInput(row, loadFinalCase(row.run), FINAL_PROMPT_PATH);
const kimiRows = rows.filter((_, index) => bool(manifest[index]!.execute_in_kimi_concurrency_batch));
const openaiRows = rows.filter((_, index) => !bool(manifest[index]!.execute_in_kimi_concurrency_batch));
if (kimiRows.length !== 6 || openaiRows.length !== 2) throw new Error("Final smoke provider-pool count mismatch.");
if (rows.some((row) => row.executionRunId.startsWith("P01F_") || row.phase !== "P01_FINAL_SMOKE")) throw new Error("Smoke/production namespace collision.");

process.stdout.write(`${JSON.stringify({ preflight: "PASS", smoke_execution_id: namespace.id, output_namespace: namespace.absoluteRoot, final_matrix_rows: matrix.length, smoke_rows: rows.length, kimi_concurrency_rows: kimiRows.length, configured_kimi_concurrency: 6, judge_target_rows: manifest.filter((row) => bool(row.judge_pipeline_required)).length, target_max_output_tokens: 8192, production_outputs_protected: true })}\n`);

let targets: FinalTargetResult[] = [];
let judges: FinalJudgeResult[] = [];
let operationalError = "";
try {
  const kimi = await executeFinalRows(kimiRows, { outputRoot: namespace.relativeRoot, maxTechnicalAttempts: 2 }, 6);
  const openai = await executeFinalRows(openaiRows, { outputRoot: namespace.relativeRoot, maxTechnicalAttempts: 1 }, 2);
  targets = [...openai, ...kimi];
  judges = await executeFinalSmokeJudges(targets, namespace.relativeRoot);
} catch (error) { operationalError = error instanceof Error ? error.message : String(error); }

const kimiResults = targets.filter((result) => result.row.run.requested_model_id === "kimi-k3");
const individualLatency = kimiResults.reduce((sum, result) => sum + result.providerResult.latencyMs, 0);
const starts = kimiResults.map((result) => new Date(result.attempt.execution_started_at).valueOf());
const ends = kimiResults.map((result) => new Date(result.attempt.execution_completed_at).valueOf());
const batchWall = starts.length ? Math.max(...ends) - Math.min(...starts) : 0;
const overlap = maxOverlap(kimiResults);
const configFailure = kimiResults.some((result) => result.providerResult.returnedModelId !== "kimi-k3" || result.providerExecutionStatus === "TRUNCATED_TOKEN_EXHAUSTION");
const targetOperationalFailure = targets.length !== 8 || targets.some((result) => result.providerExecutionStatus === "PROVIDER_API_FAILURE" || !result.langfuse.ok);
const selectedTargetFailure = targets.filter((result) => ["P01FS_C01_BL_SOL_R01", "P01FS_C10_SD_AUTH_KIMI3_R01"].includes(result.row.executionRunId)).some((result) => result.parsed.parsingStatus !== "SUCCESS");
const judgeFailure = judges.length !== 4 || judges.some((result) => !result.judgeTrace.ok || !result.scoreEmission.ok);
const verdict = configFailure || selectedTargetFailure ? "NO_GO" : operationalError || targetOperationalFailure || judgeFailure || overlap < 6 ? "PATCH_OPERATIONAL" : "GO";

const summary = {
  smoke_id: "P01_FINAL_ONE_SHOT_SMOKE_V1.0", smoke_execution_id: namespace.id,
  output_namespace: namespace.absoluteRoot, verdict, generated_at: new Date().toISOString(),
  planned_target_calls: 8, completed_target_records: targets.length, kimi_planned_concurrency: 6,
  kimi_max_observed_overlap: overlap, kimi_sum_individual_latency_ms: individualLatency,
  kimi_batch_wall_clock_ms: batchWall, concurrency_speedup: batchWall ? individualLatency / batchWall : null,
  target_results: targets.map((result) => ({
    smoke_run_id: result.row.executionRunId, source_final_run_id: result.row.sourceFinalRunId,
    requested_model: result.providerResult.requestedModelId, returned_model: result.providerResult.returnedModelId ?? null,
    reasoning_effort: result.row.run.reasoning_effort, start: result.attempt.execution_started_at,
    end: result.attempt.execution_completed_at, latency_ms: result.providerResult.latencyMs,
    finish_reason: result.providerResult.finishReason ?? null, token_usage: result.providerResult.usage,
    provider_status: result.providerExecutionStatus, parser_status: result.parsed.parsingStatus,
    risk: result.parsed.riskProbability ?? null, confidence: result.parsed.confidence ?? null,
    raw_path: result.rawPath, parsed_path: result.parsedPath, observability_path: result.observabilityPath,
    langfuse: result.langfuse
  })),
  judges: judges.map((result) => ({ target_run_id: result.targetRunId, judge: result.judge, model: result.execution.judge_model_id, raw_path: result.rawPath, score_path: result.scorePath, judge_trace: result.judgeTrace, score_emission: result.scoreEmission })),
  operational_error: operationalError || null
};
const root = namespace.absoluteRoot;
writeImmutable(path.join(root, "P01_FINAL_ONE_SHOT_SMOKE_SUMMARY.json"), `${JSON.stringify(summary, null, 2)}\n`);
const report = `# P01 Final One-Shot Smoke Report\n\n## Smoke namespace\n\n${namespace.id}\n\n## Verdict\n\n${verdict}\n\n## Execution\n\n- Target records: ${targets.length}/8\n- Kimi K3 records: ${kimiResults.length}/6\n- Maximum observed Kimi overlap: ${overlap}/6\n- Kimi summed latency: ${individualLatency} ms\n- Kimi batch wall clock: ${batchWall} ms\n- Concurrency speedup: ${batchWall ? (individualLatency / batchWall).toFixed(2) : "n/a"}x\n- Judge executions: ${judges.length}/4\n\n## Integrity\n\n- Target model identities matched: ${targets.every((result) => result.providerResult.returnedModelId === result.providerResult.requestedModelId)}\n- Judge-selected outputs parseable: ${!selectedTargetFailure}\n- Target Langfuse traces emitted: ${targets.length === 8 && targets.every((result) => result.langfuse.ok)}\n- Judge traces and criterion scores emitted: ${judges.length === 4 && judges.every((result) => result.judgeTrace.ok && result.scoreEmission.ok)}\n- Smoke outputs isolated from production: true\n\n## Operational issue\n\n${operationalError || "None recorded."}\n\n${verdict}\n`;
writeImmutable(path.join(root, "P01_FINAL_ONE_SHOT_SMOKE_REPORT.md"), report);
process.stdout.write(`${JSON.stringify({ smoke_verdict: verdict, report: path.join(root, "P01_FINAL_ONE_SHOT_SMOKE_REPORT.md"), summary: path.join(root, "P01_FINAL_ONE_SHOT_SMOKE_SUMMARY.json") })}\n`);
