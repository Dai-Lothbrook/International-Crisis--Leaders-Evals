import "dotenv/config";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { loadCasePackageForRun } from "../lib/case_loader.js";
import { classifyExecutionOutcome, classifyProviderExecution } from "../lib/execution_status.js";
import type { ExecutionAttemptMetadata, ParsedP01Output, ProviderResult } from "../lib/execution_types.js";
import { RUN_MATRIX_PATH, P01_PROMPT_PATH, resolveProjectPath } from "../lib/paths.js";
import { buildProvenance } from "../lib/provenance.js";
import { loadAndValidateRunMatrix } from "../lib/run_matrix.js";
import { assertTreatmentWindowWithinCutoff, loadTemporalContract } from "../lib/temporal_contract.js";
import { renderP01Input } from "../renderers/p01_renderer.js";
import type { P01JudgeExecutionEnvelope, P01JudgeResult } from "../scorers/judge_types.js";
import { buildLocalJudgeScoreEnvelope, writeLocalJudgeScoreImmutable } from "../scorers/langfuse_scores.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const rows = loadAndValidateRunMatrix(RUN_MATRIX_PATH);
const temporal = loadTemporalContract();
for (const caseId of ["C01", "C02", "C03", "C04"]) {
  for (const condition of ["BL", "SD", "WD", "ND"]) {
    const row = rows.find((candidate) => candidate.case_id === caseId && candidate.condition_code === condition);
    assert(row, `Missing temporal fixture row ${caseId}/${condition}`);
    const rendered = renderP01Input(row, loadCasePackageForRun(row), P01_PROMPT_PATH);
    const contract = temporal.cases[caseId];
    assert(contract && rendered.evidenceCutoff === contract.evidence_cutoff, `Rendered cutoff mismatch ${caseId}/${condition}`);
    assert(rendered.exactText.includes(contract.evidence_cutoff_visible), `Final visible cutoff missing ${caseId}/${condition}`);
  }
}
let rejectedAfterCutoff = false;
try {
  assertTreatmentWindowWithinCutoff(
    { start: "2034-03-06T15:20:00+02:00", end: "2034-03-06T16:20:00+02:00", visible_range: "fixture" },
    "2034-03-06T16:15:00+02:00",
    "C03_AFTER_CUTOFF_FIXTURE"
  );
} catch { rejectedAfterCutoff = true; }
assert(rejectedAfterCutoff, "Temporal validator accepted post-cutoff C03 evidence.");

const successfulParsed: ParsedP01Output = { parsingStatus: "SUCCESS", originalResponse: "fixture", riskProbability: 10, confidence: 60 };
const malformedParsed: ParsedP01Output = { parsingStatus: "MODEL_OUTPUT_SCHEMA_VIOLATION", originalResponse: "fixture" };
const parserFailed: ParsedP01Output = { parsingStatus: "PARSER_BUG", originalResponse: "fixture" };
const baseResult: ProviderResult = { text: "fixture", provider: "fixture", requestedModelId: "fixture-model", returnedModelId: "fixture-model", rawResponse: {}, usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 }, latencyMs: 1, finishReason: "completed" };
assert(classifyExecutionOutcome(baseResult, successfulParsed) === "NORMAL_COMPLETION", "Normal completion misclassified.");
const truncated = { ...baseResult, finishReason: "length" };
assert(classifyProviderExecution(truncated) === "TRUNCATED_TOKEN_EXHAUSTION", "Truncation fixture misclassified.");
assert(classifyExecutionOutcome(truncated, malformedParsed) === "TRUNCATED_TOKEN_EXHAUSTION", "Truncation was mislabeled as malformed output.");
const providerFailed = { ...baseResult, text: "", technicalError: { name: "APIError", message: "fixture" } };
assert(classifyExecutionOutcome(providerFailed, malformedParsed) === "PROVIDER_API_FAILURE", "Provider failure fixture misclassified.");
assert(classifyExecutionOutcome(baseResult, malformedParsed) === "MALFORMED_MODEL_OUTPUT", "Malformed output fixture misclassified.");
assert(classifyExecutionOutcome(baseResult, parserFailed) === "PARSER_FAILURE", "Parser failure fixture misclassified.");

const historicalRunId = "P01_C01_BL_KIMI27C_R01";
const sampleRun = rows.find((row) => row.run_id === historicalRunId);
assert(sampleRun, "Run Matrix is empty.");
const historicalRaw = JSON.parse(fs.readFileSync(resolveProjectPath(sampleRun.raw_output_path), "utf8")) as { run_id: string; execution_attempt_id: string; rendered_input_hash: string };
const historicalObservability = JSON.parse(fs.readFileSync(resolveProjectPath(`outputs/observability/P01/${historicalRunId}.json`), "utf8")) as { run_id: string; execution_attempt_id: string; rendered_input_hash: string; traceId: string; generationObservationId: string };
assert(historicalRaw.run_id === sampleRun.run_id && historicalObservability.run_id === sampleRun.run_id, "Historical run/matrix linkage failed.");
assert(historicalRaw.execution_attempt_id === historicalObservability.execution_attempt_id, "Historical attempt/trace linkage failed.");
assert(historicalRaw.rendered_input_hash === historicalObservability.rendered_input_hash, "Historical rendered hash linkage failed.");
assert(historicalObservability.traceId && historicalObservability.generationObservationId, "Historical Langfuse identifiers missing.");
const sampleRendered = renderP01Input(sampleRun, loadCasePackageForRun(sampleRun), P01_PROMPT_PATH);
const attempt: ExecutionAttemptMetadata = {
  execution_attempt_id: randomUUID(), attempt_number: 1, retry_of_attempt_id: null,
  execution_started_at: "2026-09-01T12:00:00.000Z", execution_completed_at: "2026-09-01T12:00:01.000Z"
};
const provenance = buildProvenance(sampleRun, sampleRendered, baseResult, attempt);
for (const value of [provenance.run_id, provenance.execution_attempt_id, provenance.case.case_version, provenance.prompt.prompt_version, provenance.rendered_prompt_hash, provenance.requested_model, provenance.returned_model, provenance.timestamps.execution_started_at, provenance.finish_reason, provenance.parser_version, provenance.scorer_version]) {
  assert(value, "Required provenance field missing.");
}
assert(provenance.retry_of_attempt_id === null, "First-attempt linkage must be null.");

const target = { run_id: sampleRun.run_id, execution_attempt_id: historicalRaw.execution_attempt_id, target_trace_id: historicalObservability.traceId, target_generation_observation_id: historicalObservability.generationObservationId };
const judgeResult: P01JudgeResult = {
  judge_item_id: "judge-item-fixture", judge_config_id: "judge-config-fixture", rubric_version: "rubric-fixture",
  criteria: {
    S1: { label: "COHERENT", rationale: "fixture", evidence_refs: ["D"], uncertain: false },
    S2: { label: "PARTIALLY_COHERENT", rationale: "fixture", evidence_refs: ["C"], uncertain: false },
    S3: { label: "NONE", rationale: "fixture", evidence_refs: ["F"], uncertain: false },
    S4: { label: "COHERENT", rationale: "fixture", evidence_refs: ["A", "G"], uncertain: false }
  }
};
const makeJudge = (judge: "judgeA" | "judgeB"): P01JudgeExecutionEnvelope => ({
  judge_execution_id: randomUUID(), judge, judge_model_id: "judge-model-fixture",
  judge_config_id: judgeResult.judge_config_id, rubric_version: judgeResult.rubric_version,
  started_at: "2026-09-01T12:00:02.000Z", completed_at: "2026-09-01T12:00:03.000Z", target, result: judgeResult
});
const envelopes = [buildLocalJudgeScoreEnvelope(makeJudge("judgeA")), buildLocalJudgeScoreEnvelope(makeJudge("judgeB"))];
assert(envelopes.flatMap((item) => item.langfuse_scores).length === 8, "Judge A/B scores were not prepared.");
for (const score of envelopes.flatMap((item) => item.langfuse_scores)) {
  assert(score.traceId === target.target_trace_id && score.observationId === target.target_generation_observation_id, "Judge score lost target association.");
}
const fixturePath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "p01-block-a-")), "judge-score.json");
writeLocalJudgeScoreImmutable(fixturePath, makeJudge("judgeA"));
assert(fs.existsSync(fixturePath), "Local judge score storage fixture failed.");

const langfuseConfig = [process.env.LANGFUSE_PUBLIC_KEY, process.env.LANGFUSE_SECRET_KEY, process.env.LANGFUSE_BASE_URL];
const configuredCount = langfuseConfig.filter(Boolean).length;
assert(configuredCount === 0 || configuredCount === 3, "Langfuse configuration is partial; require public key, secret key, and base URL together.");

console.log(JSON.stringify({
  status: "PASS_NO_API_CALLS",
  temporal_fixture: { rendered_cells: 16, post_cutoff_rejected: true },
  execution_status_fixture: ["NORMAL_COMPLETION", "TRUNCATED_TOKEN_EXHAUSTION", "PROVIDER_API_FAILURE", "MALFORMED_MODEL_OUTPUT", "PARSER_FAILURE"],
  provenance_sanity: { future_envelope: "PASS", historical_raw_matrix_trace_link: "PASS", historical_run_id: historicalRunId },
  judge_plumbing: { judges: 2, prepared_scores: 8, exact_target_association: true, local_storage: true, langfuse_configured: configuredCount === 3 }
}, null, 2));
