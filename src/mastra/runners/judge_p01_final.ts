import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { executeFinalProductionJudges } from "../final/judges.js";
import { auditFinalJudgeStorage } from "../final/judge_audit.js";
import { FINAL_PROMPT_PATH, loadFinalCase, loadFinalMatrix } from "../final/loader.js";
import { renderFinalInput } from "../final/renderer.js";
import type { FinalExecutionRow, FinalTargetResult } from "../final/types.js";
import type { ProviderResult } from "../lib/execution_types.js";
import { resolveProjectPath } from "../lib/paths.js";

if (!process.argv.includes("--confirm-816-final-judges")) {
  process.stderr.write("P01 Final production judges not executed. Re-run with --confirm-816-final-judges.\n");
  process.exit(2);
}
for (const name of ["OPENAI_API_KEY", "LANGFUSE_PUBLIC_KEY", "LANGFUSE_SECRET_KEY", "LANGFUSE_BASE_URL"]) {
  if (!process.env[name]) throw new Error(`Required environment variable is absent: ${name}`);
}

const outputRoot = "outputs/final/P01";
const root = resolveProjectPath(outputRoot);
const matrix = loadFinalMatrix();
if (matrix.length !== 408) throw new Error(`Expected exactly 408 frozen Final rows; found ${matrix.length}.`);
const targets: FinalTargetResult[] = matrix.map((run) => {
  const row: FinalExecutionRow = { run, executionRunId: run.run_id, sourceFinalRunId: run.run_id, phase: "P01_FINAL" };
  const rendered = renderFinalInput(row, loadFinalCase(run), FINAL_PROMPT_PATH);
  const rawDirectory = path.join(root, "raw", run.run_id);
  const rawFiles = fs.readdirSync(rawDirectory).filter((name) => /^attempt_\d+\.json$/.test(name)).sort();
  if (!rawFiles.length) throw new Error(`Missing target RAW: ${run.run_id}`);
  const rawPath = path.join(rawDirectory, rawFiles.at(-1)!);
  const raw = JSON.parse(fs.readFileSync(rawPath, "utf8")) as {
    attempt: FinalTargetResult["attempt"];
    rendered_input_hash: string;
    provider_execution_status: FinalTargetResult["providerExecutionStatus"];
    result: ProviderResult;
  };
  const parsedPath = path.join(root, "parsed", `${run.run_id}.json`);
  const parsedEnvelope = JSON.parse(fs.readFileSync(parsedPath, "utf8")) as { parsed: FinalTargetResult["parsed"]; execution_outcome_status: FinalTargetResult["executionOutcomeStatus"] };
  const observabilityPath = path.join(root, "observability", `${run.run_id}.json`);
  const observability = JSON.parse(fs.readFileSync(observabilityPath, "utf8")) as { langfuse: FinalTargetResult["langfuse"] };
  if (raw.rendered_input_hash !== rendered.renderedInputHash) throw new Error(`Target rendered hash mismatch: ${run.run_id}`);
  if (parsedEnvelope.parsed.parsingStatus !== "SUCCESS") throw new Error(`Target is not judge-eligible: ${run.run_id}`);
  if (!observability.langfuse.ok || !observability.langfuse.traceId || !observability.langfuse.generationObservationId) throw new Error(`Target lacks Langfuse lineage: ${run.run_id}`);
  return {
    row, rendered, providerResult: raw.result, parsed: parsedEnvelope.parsed, attempt: raw.attempt,
    providerExecutionStatus: raw.provider_execution_status, executionOutcomeStatus: parsedEnvelope.execution_outcome_status,
    rawPath, parsedPath, observabilityPath, langfuse: observability.langfuse, skipped: true
  };
});

const judgeRoot = path.join(root, "judges");
const plannedCells = targets.flatMap((target) => (["judgeA", "judgeB"] as const).map((judge) => ({ itemId: `${target.row.executionRunId}_${judge}`, targetRunId: target.row.executionRunId, judge })));
const before = auditFinalJudgeStorage(judgeRoot, plannedCells);
process.stdout.write(`${JSON.stringify({
  confirmation: "PASS", existing_targets: targets.length, planned_judge_cells: 816,
  valid_scored_unique_cells: before.valid_scored_unique_cells.length,
  reusable_valid_unscored_raw_cells: before.reusable_valid_unscored_raw_cells.length,
  unique_cells_requiring_new_paid_calls: before.unique_cells_requiring_new_paid_calls.length,
  unique_terminal_nonretryable_cells: before.unique_terminal_nonretryable_cells.length,
  billing_quota_failure_envelopes: before.billing_quota_failure_envelopes,
  langfuse_fully_complete_scored_cells: before.langfuse_fully_complete_scored_cells,
  langfuse_incomplete_scored_cells: before.langfuse_incomplete_scored_cells,
  target_calls: 0
})}\n`);
const batch = await executeFinalProductionJudges(targets, outputRoot);
const skipped = batch.results.filter((item) => item.skipped).length;
const after = auditFinalJudgeStorage(judgeRoot, plannedCells);
process.stdout.write(`${JSON.stringify({
  status: after.unique_terminal_nonretryable_cells.length || after.unique_cells_requiring_new_paid_calls.length ? "COMPLETE_WITH_RECORDED_FAILURES" : "COMPLETE",
  planned_unique_cells: 816,
  valid_scored_unique_cells: after.valid_scored_unique_cells.length,
  reusable_valid_unscored_raw_cells: after.reusable_valid_unscored_raw_cells.length,
  unique_cells_requiring_new_paid_calls: after.unique_cells_requiring_new_paid_calls.length,
  unique_terminal_nonretryable_cells: after.unique_terminal_nonretryable_cells.length,
  langfuse_fully_complete_scored_cells: after.langfuse_fully_complete_scored_cells,
  langfuse_incomplete_scored_cells: after.langfuse_incomplete_scored_cells,
  execution_failures_this_resume: batch.failures.length,
  skipped_valid_scores: skipped,
  newly_scored_from_reusable_raws: batch.results.length - skipped,
  target_calls: 0
})}\n`);
