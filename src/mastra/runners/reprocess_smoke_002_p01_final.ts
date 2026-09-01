import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { classifyExecutionOutcome, classifyProviderExecution } from "../lib/execution_status.js";
import type { ExecutionAttemptMetadata, ProviderResult } from "../lib/execution_types.js";
import { resolveProjectPath } from "../lib/paths.js";
import { executeFinalSmokeJudges, type FinalJudgeResult } from "../final/judges.js";
import { writeImmutable } from "../final/execution.js";
import { FINAL_PROMPT_PATH, loadFinalCase, loadFinalMatrix, loadFinalSmokeManifest } from "../final/loader.js";
import { renderFinalInput } from "../final/renderer.js";
import type { FinalExecutionRow, FinalTargetResult } from "../final/types.js";
import { parseP01Output } from "../parsers/p01_output_parser.js";

const PARSER_VERSION = "P01_OUTPUT_PARSER_V0.4";
const smokeId = "P01_FINAL_SMOKE_002";
const relativeRoot = `outputs/smoke/P01_FINAL/${smokeId}`;
const root = resolveProjectPath(relativeRoot);
const reprocessedRoot = path.join(root, "reprocessed", "PARSER_V0.4");
const judgeRoot = path.join(root, "judges");
if (!fs.existsSync(root)) throw new Error(`Smoke 002 does not exist: ${root}`);
if (fs.existsSync(judgeRoot)) throw new Error(`Judge output namespace already exists; refusing duplicate paid judge execution: ${judgeRoot}`);

const matrix = loadFinalMatrix();
const { manifest, sourceRows } = loadFinalSmokeManifest(matrix);
const targets: FinalTargetResult[] = [];

for (let index = 0; index < manifest.length; index += 1) {
  const smoke = manifest[index]!;
  const row: FinalExecutionRow = {
    run: sourceRows[index]!, executionRunId: smoke.smoke_run_id, sourceFinalRunId: smoke.source_final_run_id,
    phase: "P01_FINAL_SMOKE", executionNamespace: smokeId
  };
  const rawDirectory = path.join(root, "raw", row.executionRunId);
  const rawFiles = fs.readdirSync(rawDirectory).filter((name) => /^attempt_\d+\.json$/.test(name)).sort();
  if (rawFiles.length !== 1) throw new Error(`Expected exactly one preserved target attempt for ${row.executionRunId}; found ${rawFiles.length}.`);
  const rawPath = path.join(rawDirectory, rawFiles[0]!);
  const raw = JSON.parse(fs.readFileSync(rawPath, "utf8")) as {
    attempt: ExecutionAttemptMetadata; rendered_input_hash: string; provider_execution_status?: FinalTargetResult["providerExecutionStatus"]; result: ProviderResult;
  };
  const observabilityPath = path.join(root, "observability", `${row.executionRunId}.json`);
  const observability = JSON.parse(fs.readFileSync(observabilityPath, "utf8")) as { langfuse: FinalTargetResult["langfuse"] };
  const rendered = renderFinalInput(row, loadFinalCase(row.run), FINAL_PROMPT_PATH);
  if (rendered.renderedInputHash !== raw.rendered_input_hash) throw new Error(`Rendered input hash mismatch for ${row.executionRunId}.`);
  const parsed = parseP01Output(raw.result.text, Boolean(raw.result.technicalError));
  const providerExecutionStatus = raw.provider_execution_status ?? classifyProviderExecution(raw.result);
  const executionOutcomeStatus = classifyExecutionOutcome(raw.result, parsed);
  const parsedPath = path.join(reprocessedRoot, `${row.executionRunId}.json`);
  writeImmutable(parsedPath, `${JSON.stringify({
    schema_version: "P01_FINAL_REPROCESSED_PARSED_ENVELOPE_V1.0", parser_version: PARSER_VERSION,
    smoke_execution_id: smokeId, run_id: row.executionRunId, source_final_run_id: row.sourceFinalRunId,
    execution_attempt_id: raw.attempt.execution_attempt_id,
    source_raw_path: path.relative(resolveProjectPath("."), rawPath).replace(/\\/g, "/"),
    rendered_input_hash: raw.rendered_input_hash, provider_execution_status: providerExecutionStatus,
    execution_outcome_status: executionOutcomeStatus, parsed
  }, null, 2)}\n`);
  targets.push({
    row, rendered, providerResult: raw.result, parsed, attempt: raw.attempt,
    providerExecutionStatus, executionOutcomeStatus, rawPath, parsedPath, observabilityPath,
    langfuse: observability.langfuse, skipped: true
  });
}

const parserResults = targets.map((target) => ({
  run_id: target.row.executionRunId, status: target.parsed.parsingStatus, parser_path: target.parsed.parserPath ?? null,
  risk: target.parsed.riskProbability ?? null, confidence: target.parsed.confidence ?? null,
  error: target.parsed.error ?? null, reprocessed_path: target.parsedPath
}));
const allParsed = targets.length === 8 && targets.every((target) => target.parsed.parsingStatus === "SUCCESS");
writeImmutable(path.join(reprocessedRoot, "P01_FINAL_SMOKE_002_REPROCESS_SUMMARY.json"), `${JSON.stringify({ parser_version: PARSER_VERSION, all_parsed: allParsed, results: parserResults }, null, 2)}\n`);

let judges: FinalJudgeResult[] = [];
let judgeError = "";
if (allParsed) {
  try { judges = await executeFinalSmokeJudges(targets, relativeRoot); }
  catch (error) { judgeError = error instanceof Error ? error.message : String(error); }
}
const judgesComplete = judges.length === 4;
const judgesObservable = judgesComplete && judges.every((item) => item.judgeTrace.ok && item.scoreEmission.ok);
const verdict = !allParsed ? "NO_GO" : (!judgesComplete || !judgesObservable ? "PATCH_OPERATIONAL" : "GO");
const summary = {
  parser_version: PARSER_VERSION, smoke_execution_id: smokeId, generated_at: new Date().toISOString(),
  target_calls_executed: 0, judge_calls_planned: allParsed ? 4 : 0, judge_results_recorded: judges.length,
  parser_results: parserResults,
  judge_results: judges.map((item) => ({
    target_run_id: item.targetRunId, judge: item.judge, model: item.execution.judge_model_id,
    criteria: item.execution.result.criteria, raw_path: item.rawPath, score_path: item.scorePath,
    judge_trace: item.judgeTrace, score_emission: item.scoreEmission
  })),
  judge_error: judgeError || null, verdict
};
const summaryPath = path.join(root, "P01_FINAL_SMOKE_002_PARSER_AND_JUDGE_SUMMARY.json");
writeImmutable(summaryPath, `${JSON.stringify(summary, null, 2)}\n`);
const rows = parserResults.map((item) => `| ${item.run_id} | ${item.status} | ${item.risk ?? "-"} | ${item.confidence ?? "-"} |`).join("\n");
const report = `# P01 Final Smoke 002 — Parser Reprocessing and Judges\n\n## Verdict\n\n${verdict}\n\n## Parser\n\n- Version: ${PARSER_VERSION}\n- Existing RAWs reprocessed: ${targets.length}/8\n- Successful parses: ${targets.filter((target) => target.parsed.parsingStatus === "SUCCESS").length}/8\n- New target-model calls: 0\n\n| Run | Status | Risk | Confidence |\n|---|---:|---:|---:|\n${rows}\n\n## Judges\n\n- Planned only after parser gate: ${allParsed ? 4 : 0}\n- Results recorded: ${judges.length}/4\n- Langfuse judge traces and score emission complete: ${judgesObservable}\n- Operational error: ${judgeError || "None"}\n\n## Interpretation\n\nThe parser gate concerns deterministic recovery of the frozen A–G substantive contract despite harmless presentation variation. It does not alter model answers or scientific content. Judge results are preserved as structured envelopes and linked to the original Smoke 002 target traces.\n`;
const reportPath = path.join(root, "P01_FINAL_SMOKE_002_PARSER_AND_JUDGE_REPORT.md");
writeImmutable(reportPath, report);
process.stdout.write(`${JSON.stringify({ verdict, parser_results: parserResults, judge_count: judges.length, judge_error: judgeError || null, report_path: reportPath, summary_path: summaryPath })}\n`);
