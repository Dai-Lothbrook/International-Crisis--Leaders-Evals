import fs from "node:fs";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { auditFinalJudgeStorage } from "../final/judge_audit.js";
import { parseJudgeJson, type JudgeConfig, type JudgeParserProvenance } from "../final/judges.js";
import { FINAL_JUDGE_CONFIG_PATH, loadFinalMatrix } from "../final/loader.js";
import type { ProviderResult } from "../lib/execution_types.js";
import { resolveProjectPath } from "../lib/paths.js";
import { writeLocalJudgeScoreImmutable } from "../scorers/langfuse_scores.js";
import { P01_FINAL_JUDGE_MODELS, type JudgeIdentity, type P01JudgeExecutionEnvelope } from "../scorers/judge_types.js";

interface StoredJudgeRaw {
  judge_item_id: string; judge: JudgeIdentity; model_id: string; started_at: string; completed_at: string;
  prompt: { user?: { judge_item_id?: string; judge_config_id?: string; rubric_version?: string } };
  result: ProviderResult;
}
interface TargetRaw { attempt: { execution_attempt_id: string }; result: ProviderResult; }
interface TargetObservability { langfuse: { traceId?: string; generationObservationId?: string }; }

const outputRoot = resolveProjectPath("outputs/final/P01");
const judgeRoot = path.join(outputRoot, "judges");
const analysisRoot = path.join(outputRoot, "analysis");
fs.mkdirSync(analysisRoot, { recursive: true });
const matrix = loadFinalMatrix();
const rowByRunId = new Map(matrix.map((row) => [row.run_id, row]));
const planned = matrix.flatMap((row) => (["judgeA", "judgeB"] as const).map((judge) => ({ itemId: `${row.run_id}_${judge}`, targetRunId: row.run_id, judge })));
const config = JSON.parse(fs.readFileSync(FINAL_JUDGE_CONFIG_PATH, "utf8")) as JudgeConfig;

function scoreHashes(): Map<string, string> {
  const directory = path.join(judgeRoot, "scores");
  return new Map(fs.readdirSync(directory).filter((name) => name.endsWith(".json") && !name.endsWith(".langfuse.json")).map((name) => [name, createHash("sha256").update(fs.readFileSync(path.join(directory, name))).digest("hex")]));
}
function latestTargetRaw(runId: string): TargetRaw {
  const directory = path.join(outputRoot, "raw", runId);
  const name = fs.readdirSync(directory).filter((value) => /^attempt_\d+\.json$/.test(value)).sort().at(-1);
  if (!name) throw new Error(`Missing target RAW: ${runId}`);
  return JSON.parse(fs.readFileSync(path.join(directory, name), "utf8")) as TargetRaw;
}
function judgeRaw(itemId: string): StoredJudgeRaw {
  const retry = path.join(judgeRoot, "raw", `${itemId}.attempt_02.json`);
  const initial = path.join(judgeRoot, "raw", `${itemId}.json`);
  return JSON.parse(fs.readFileSync(fs.existsSync(retry) ? retry : initial, "utf8")) as StoredJudgeRaw;
}
function provenance(raw: StoredJudgeRaw): JudgeParserProvenance {
  return { storedItemId: raw.judge_item_id, storedJudge: raw.judge, storedModelId: raw.model_id, requestedModelId: raw.result.requestedModelId, promptItemId: raw.prompt?.user?.judge_item_id, promptConfigId: raw.prompt?.user?.judge_config_id, promptRubricVersion: raw.prompt?.user?.rubric_version };
}

const beforeHashes = scoreHashes();
const before = auditFinalJudgeStorage(judgeRoot, planned);
if (before.valid_scored_unique_cells.length !== 643 || before.reusable_valid_unscored_raw_cells.length !== 50 || before.unique_terminal_nonretryable_cells.length !== 123 || before.unique_cells_requiring_new_paid_calls.length !== 0) throw new Error("Unexpected pre-recovery inventory.");
let flatShape = 0;
let criteriaWrapperShape = 0;
for (const itemId of before.reusable_valid_unscored_raw_cells) {
  const targetRunId = itemId.replace(/_judge[AB]$/, "");
  const judge: JudgeIdentity = itemId.endsWith("_judgeA") ? "judgeA" : "judgeB";
  const raw = judgeRaw(itemId);
  const decoded = JSON.parse(raw.result.text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")) as Record<string, unknown>;
  if (decoded.criteria) criteriaWrapperShape += 1; else flatShape += 1;
  const parsed = parseJudgeJson(raw.result.text, config, itemId, judge, raw.result.returnedModelId, provenance(raw));
  const target = latestTargetRaw(targetRunId);
  const observability = JSON.parse(fs.readFileSync(path.join(outputRoot, "observability", `${targetRunId}.json`), "utf8")) as TargetObservability;
  if (!observability.langfuse.traceId || !observability.langfuse.generationObservationId) throw new Error(`Missing target lineage: ${targetRunId}`);
  const execution: P01JudgeExecutionEnvelope = {
    judge_execution_id: randomUUID(), judge, judge_model_id: P01_FINAL_JUDGE_MODELS[judge], judge_config_id: config.config_id, rubric_version: config.rubric_version,
    started_at: raw.started_at, completed_at: raw.completed_at,
    target: { run_id: targetRunId, execution_attempt_id: target.attempt.execution_attempt_id, target_trace_id: observability.langfuse.traceId, target_generation_observation_id: observability.langfuse.generationObservationId }, result: parsed
  };
  writeLocalJudgeScoreImmutable(path.join(judgeRoot, "scores", `${itemId}.json`), execution);
}
const after = auditFinalJudgeStorage(judgeRoot, planned);
if (after.valid_scored_unique_cells.length !== 693 || after.reusable_valid_unscored_raw_cells.length !== 0 || after.unique_terminal_nonretryable_cells.length !== 123 || after.unique_cells_requiring_new_paid_calls.length !== 0) throw new Error("Post-recovery inventory failed 693/123 reconciliation.");
const afterHashes = scoreHashes();
const changedExisting = [...beforeHashes].filter(([name, hash]) => afterHashes.get(name) !== hash);
if (changedExisting.length) throw new Error(`Previously valid scores changed: ${changedExisting.map(([name]) => name).join(", ")}`);

const uniqueTargetMetrics = new Map<string, { chars: number; outputTokens: number | null; reasoningTokens: number | null }>();
for (const row of matrix) { const target = latestTargetRaw(row.run_id).result; uniqueTargetMetrics.set(row.run_id, { chars: target.text.length, outputTokens: target.usage.outputTokens ?? null, reasoningTokens: target.usage.reasoningTokens ?? null }); }
const availableTargetTokens = [...uniqueTargetMetrics.values()].map((value) => value.outputTokens).filter((value): value is number => value != null).sort((a, b) => a - b);
const quantile = (p: number) => availableTargetTokens[Math.max(0, Math.ceil(p * availableTargetTokens.length) - 1)]!;
const tokenCuts = { p25: quantile(0.25), p50: quantile(0.5), p75: quantile(0.75) };
const tokenBin = (value: number | null) => value == null ? "MISSING" : value <= tokenCuts.p25 ? `Q1 <= ${tokenCuts.p25}` : value <= tokenCuts.p50 ? `Q2 ${tokenCuts.p25 + 1}-${tokenCuts.p50}` : value <= tokenCuts.p75 ? `Q3 ${tokenCuts.p50 + 1}-${tokenCuts.p75}` : `Q4 > ${tokenCuts.p75}`;
const terminal = new Set(after.unique_terminal_nonretryable_cells);
const allCells = planned.map(({ itemId, targetRunId, judge }) => {
  const row = rowByRunId.get(targetRunId)!; const target = uniqueTargetMetrics.get(targetRunId)!;
  return { judge_item_id: itemId, target_run_id: targetRunId, judge: judge === "judgeA" ? "A" : "B", frozen_judge_model: P01_FINAL_JUDGE_MODELS[judge], target_model: row.model_alias, target_model_id: row.requested_model_id, case_id: row.case_id, case_family: row.coverage_family, core_vs_stress: row.case_role, condition: row.condition, authority_status: row.authority_condition.toLowerCase() === "true" ? "AUTHORITY" : "NON_AUTHORITY", sentinel_status: row.sentinel_block.toLowerCase() === "true" ? "RELIABILITY_SENTINEL" : "NORMAL", repetition: `R${row.repetition.padStart(2, "0")}`, target_output_chars: target.chars, target_output_tokens: target.outputTokens, target_reasoning_tokens: target.reasoningTokens, target_output_token_bin: tokenBin(target.outputTokens), truncated: terminal.has(itemId) };
});
const truncationRows = allCells.filter((cell) => cell.truncated).map((cell) => {
  const raw = judgeRaw(cell.judge_item_id);
  const reasoningTokens = raw.result.usage.reasoningTokens ?? (raw.result.rawResponse as { usage?: { output_tokens_details?: { reasoning_tokens?: number } } } | null)?.usage?.output_tokens_details?.reasoning_tokens ?? null;
  return { ...cell, finish_reason: raw.result.finishReason ?? "", finish_reason_detail: raw.result.finishReasonDetail ?? "", output_tokens: raw.result.usage.outputTokens ?? null, reasoning_tokens: reasoningTokens, visible_response_state: raw.result.text.trim() ? "PARTIAL" : "EMPTY", visible_response_chars: raw.result.text.length, judge_input_tokens: raw.result.usage.inputTokens ?? null, judge_total_tokens: raw.result.usage.totalTokens ?? null, judge_latency_ms: raw.result.latencyMs };
});
if (truncationRows.length !== 123) throw new Error(`Expected 123 truncation rows; found ${truncationRows.length}.`);
type Cell = typeof allCells[number];
function grouped(keys: Array<keyof Cell>) {
  const map = new Map<string, { dimensions: Record<string, string | number | boolean | null>; planned: number; truncated: number }>();
  for (const cell of allCells) { const dimensions = Object.fromEntries(keys.map((key) => [key, cell[key] as string | number | boolean | null])); const id = JSON.stringify(dimensions); const entry = map.get(id) ?? { dimensions, planned: 0, truncated: 0 }; entry.planned += 1; if (cell.truncated) entry.truncated += 1; map.set(id, entry); }
  return [...map.values()].map((entry) => ({ ...entry.dimensions, numerator_truncated: entry.truncated, denominator_planned: entry.planned, truncation_rate_pct: Number((100 * entry.truncated / entry.planned).toFixed(2)) }));
}
function mean(values: number[]) { return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null; }
function median(values: number[]) { if (!values.length) return null; const sorted = [...values].sort((a, b) => a - b); const mid = Math.floor(sorted.length / 2); return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2; }
const truncTargetTokens = allCells.filter((cell) => cell.truncated && cell.target_output_tokens != null).map((cell) => cell.target_output_tokens as number);
const observedTargetTokens = allCells.filter((cell) => !cell.truncated && cell.target_output_tokens != null).map((cell) => cell.target_output_tokens as number);
const empty = truncationRows.filter((row) => row.visible_response_state === "EMPTY"); const partial = truncationRows.filter((row) => row.visible_response_state === "PARTIAL");
const distributions = { judge: grouped(["judge"]), target_model: grouped(["target_model"]), case: grouped(["case_id"]), case_family: grouped(["case_family"]), core_stress: grouped(["core_vs_stress"]), condition: grouped(["condition"]), authority: grouped(["authority_status"]), sentinel: grouped(["sentinel_status"]), repetition: grouped(["repetition"]), target_output_token_bin: grouped(["target_output_token_bin"]), judge_x_target_model: grouped(["judge", "target_model"]), judge_x_case: grouped(["judge", "case_id"]), judge_x_condition: grouped(["judge", "condition"]), judge_x_target_output_token_bin: grouped(["judge", "target_output_token_bin"]) };
const summary = {
  schema_version: "P01_FINAL_TRUNCATION_SUMMARY_V1.0", generated_at: new Date().toISOString(),
  inventory: { planned_semantic_judge_cells: 816, target_generations_complete: 408, deterministic_outputs_complete: fs.readdirSync(path.join(outputRoot, "parsed")).filter((name) => name.endsWith(".json")).length, valid_local_semantic_scores: 693, semantic_score_coverage_pct: Number((100 * 693 / 816).toFixed(2)), terminal_truncations: 123, truncation_rate_pct: Number((100 * 123 / 816).toFixed(2)), new_paid_calls_required: 0 },
  recovery: { scores_before: 643, recovered_from_existing_raw: 50, scores_after: 693, prior_score_hashes_unchanged: true, recovered_shapes: { flat_S1_S4: flatShape, criteria_wrapper: criteriaWrapperShape } },
  truncation_state: { empty: empty.length, partial: partial.length, visible_state_distribution: [{ visible_response_state: "EMPTY", numerator_truncated: empty.length, denominator_planned: 816, truncation_rate_pct: Number((100 * empty.length / 816).toFixed(2)) }, { visible_response_state: "PARTIAL", numerator_truncated: partial.length, denominator_planned: 816, truncation_rate_pct: Number((100 * partial.length / 816).toFixed(2)) }], all_at_4096_output_tokens: truncationRows.every((row) => row.output_tokens === 4096), all_finish_detail_max_output_tokens: truncationRows.every((row) => row.finish_reason_detail === "max_output_tokens"), reasoning_tokens_available: truncationRows.filter((row) => row.reasoning_tokens != null).length },
  target_output_length: { token_cuts: tokenCuts, truncated_mean_tokens: mean(truncTargetTokens), truncated_median_tokens: median(truncTargetTokens), nontruncated_mean_tokens: mean(observedTargetTokens), nontruncated_median_tokens: median(observedTargetTokens) }, distributions,
  recovery_sensitivity: { binding_constraint_evidence: "All 123 terminal cells ended at exactly 4096 output tokens with max_output_tokens.", high_plausibility_avoidable: partial.length, broad_plausibility_upper_bound: 123, interpretation: "Partial cells are the strongest local candidates for completion under 8192. Empty reasoning-only cells may also complete, but local evidence cannot determine the additional budget required." }, truncation_cells: truncationRows
};
const summaryPath = path.join(analysisRoot, "P01_FINAL_TRUNCATION_SUMMARY.json"); fs.writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
const table = (rows: Array<Record<string, unknown>>, label: string) => { const dims = Object.keys(rows[0] ?? {}).filter((key) => !["numerator_truncated", "denominator_planned", "truncation_rate_pct"].includes(key)); return `### ${label}\n\n| ${dims.join(" | ")} | Truncated | Planned | Rate |\n|${dims.map(() => "---").join("|")}|---:|---:|---:|\n${rows.map((row) => `| ${dims.map((key) => String(row[key])).join(" | ")} | ${row.numerator_truncated} | ${row.denominator_planned} | ${Number(row.truncation_rate_pct).toFixed(2)}% |`).join("\n")}\n`; };
const recoveryReport = `# P01 Final — 50 RAW Recovery Report\n\n## Result\n\nLocal recovery completed without model or Langfuse API calls. The hardened deterministic parser recovered all 50 complete, previously unscored RAWs: ${flatShape} used a flat S1–S4 object and ${criteriaWrapperShape} used a \`criteria\` wrapper. Exact item, judge-model, prompt, config, rubric, target-run, execution-attempt, and target-lineage associations were verified from immutable local provenance before score creation.\n\n## Integrity checks\n\n- Valid local scores before recovery: **643**\n- Recovered locally: **50/50**\n- Valid local scores after recovery: **693**\n- Terminal truncations retained: **123**\n- Planned semantic-judge cells: **816**\n- New paid calls: **0**\n- Previously valid score files changed: **0**\n- Combined pre-existing score-hash verification: **PASS**\n\nThe original judge RAWs were not modified. New local score envelopes use the frozen Judge A/B identities, \`${config.config_id}\`, \`${config.rubric_version}\`, and existing target lineage. Missing Langfuse score emissions were not repaired; this task recovered local scores only.\n`;
fs.writeFileSync(path.join(analysisRoot, "P01_FINAL_50_RAW_RECOVERY_REPORT.md"), recoveryReport, "utf8");
const judgeB = (distributions.judge as Array<Record<string, unknown>>).find((row) => row.judge === "B")!;
const integrityReport = `# P01 Final — Measurement Integrity Report\n\n## Executive finding\n\nTarget generation is complete at **408/408**, and deterministic parsed measurements are complete at **408/408**. Semantic-judge measurement is **693/816 (${(100 * 693 / 816).toFixed(2)}%)** after local recovery. The **123/816 (${(100 * 123 / 816).toFixed(2)}%)** missing semantic judgments are genuine frozen-protocol truncations, not missing target outputs.\n\nAll truncations occurred in Judge B: **${judgeB.numerator_truncated}/${judgeB.denominator_planned} (${Number(judgeB.truncation_rate_pct).toFixed(2)}%)**; Judge A had none. This makes missingness strongly judge-specific. The tables below are descriptive, not causal.\n\n${table(distributions.target_model as Array<Record<string, unknown>>, "Target model")}\n${table(distributions.case as Array<Record<string, unknown>>, "Case")}\n${table(distributions.case_family as Array<Record<string, unknown>>, "Case family")}\n${table(distributions.core_stress as Array<Record<string, unknown>>, "Core versus Stress")}\n${table(distributions.condition as Array<Record<string, unknown>>, "Condition")}\n${table(distributions.authority as Array<Record<string, unknown>>, "Authority")}\n${table(distributions.sentinel as Array<Record<string, unknown>>, "Reliability Sentinel")}\n${table(distributions.repetition as Array<Record<string, unknown>>, "Repetition")}\n${table(distributions.judge_x_target_model as Array<Record<string, unknown>>, "Judge × target model")}\n${table(distributions.judge_x_case as Array<Record<string, unknown>>, "Judge × case")}\n${table(distributions.judge_x_condition as Array<Record<string, unknown>>, "Judge × condition")}\n${table(distributions.judge_x_target_output_token_bin as Array<Record<string, unknown>>, "Judge × target-output-token quartile")}\n## Target-output length\n\nTruncated cells had mean/median target-output lengths of **${mean(truncTargetTokens)?.toFixed(1)} / ${median(truncTargetTokens)?.toFixed(1)} tokens**, versus **${mean(observedTargetTokens)?.toFixed(1)} / ${median(observedTargetTokens)?.toFixed(1)} tokens** for non-truncated cells. Quartile rates above are more informative than raw means. Any association may reflect correlated case/model composition.\n\n## Measurement interpretation\n\nThe 693 semantic scores provide substantial coverage, but they are not a simple random 84.93% sample. Analyses should report available denominators and use judge-specific or complete-case sensitivity checks. P01 validity is not established or refuted by this truncation rate alone.\n\n## Possible separately versioned recovery\n\nAll 123 terminal responses reached exactly 4,096 output tokens with \`max_output_tokens\`, so the ceiling was demonstrably binding. The **${partial.length} partial** responses are high-plausibility candidates for completion at 8,192; the **${empty.length} empty, reasoning-only** responses might also complete, but local evidence cannot establish their required budget. Thus ${partial.length} is a defensible high-plausibility subset and 123 an uncertainty-bound upper candidate count, not a forecast.\n\nA future **P01 Semantic Judge Recovery / Sensitivity v1.1** should be separately frozen and labeled, cover only these 123 item IDs, preserve the same inputs, judges, rubric and reasoning settings, use a documented 8,192-token ceiling, retain all v1.0 failures, and write new attempt/run namespaces. Its results should be reported alongside—not silently substituted for—v1.0.\n`;
fs.writeFileSync(path.join(analysisRoot, "P01_FINAL_MEASUREMENT_INTEGRITY_REPORT.md"), integrityReport, "utf8");
process.stdout.write(`${JSON.stringify({ status: "PASS", scores_before: 643, recovered: 50, scores_after: 693, terminal: 123, prior_scores_unchanged: true, truncation_rows: truncationRows.length, summary_path: summaryPath })}\n`);
