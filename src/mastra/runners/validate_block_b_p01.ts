import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { classifyP01AnalysisStatus, summarizeP01RunCounts } from "../lib/execution_status.js";
import type { ParsedP01Output, ProviderResult } from "../lib/execution_types.js";
import { resolveProjectPath } from "../lib/paths.js";
import { renderP01FinalModelVisible } from "../renderers/p01_renderer.js";
import { scoreP01Conditions } from "../scorers/deterministic_p01.js";
import { buildBlindedP01JudgeInput } from "../scorers/judge_input.js";
import { P01_FINAL_JUDGE_MODELS, type P01JudgeResult } from "../scorers/judge_types.js";
import { prepareJudgeScores } from "../scorers/langfuse_scores.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const finalDir = resolveProjectPath("experiment/P01/final");
const readJson = <T>(name: string): T => JSON.parse(fs.readFileSync(path.join(finalDir, name), "utf8")) as T;
const runConfig = readJson<Record<string, any>>("run_config_schema_v1.0.json");
const judgeConfig = readJson<Record<string, any>>("judge_config_v1.0.json");
const caseTemplate = readJson<Record<string, any>>("case_template_v1.0.json");

const scores = scoreP01Conditions({
  BL: [{ risk: 30, confidence: 60, repetition: "R01" }, { risk: 32, confidence: 62, repetition: "R02" }, { risk: 31, confidence: 61, repetition: "R03" }],
  WD: [{ risk: 36, confidence: 61, repetition: "R01" }, { risk: 37, confidence: 63, repetition: "R02" }, { risk: 38, confidence: 62, repetition: "R03" }],
  SD: [{ risk: 50, confidence: 70, repetition: "R01" }, { risk: 52, confidence: 72, repetition: "R02" }, { risk: 51, confidence: 71, repetition: "R03" }],
  ND: [{ risk: 32, confidence: 60, repetition: "R01" }, { risk: 31, confidence: 62, repetition: "R02" }, { risk: 30, confidence: 61, repetition: "R03" }]
}, 1);
assert(scores.cellRisk.BL === 31 && scores.deltaRisk.SD === 20, "Median CellRisk/DeltaRisk fixture failed.");
assert(scores.signedNdDrift === 0 && scores.ndDrift === 0, "ND drift fixture failed.");
assert(scores.sdWdPairwiseOrdering.length === 9, "SD×WD all-pairs support failed.");
assert(scores.crossRepetitionDelta.SD.length === 9, "Cross-repetition baseline support failed.");

const baseProvider: ProviderResult = { text: "fixture", provider: "fixture", requestedModelId: "fixture", rawResponse: {}, usage: {}, latencyMs: 1, finishReason: "completed" };
const success: ParsedP01Output = { parsingStatus: "SUCCESS", originalResponse: "fixture", riskProbability: 30, confidence: 60 };
const brittle: ParsedP01Output = { parsingStatus: "MODEL_OUTPUT_SCHEMA_VIOLATION", originalResponse: "Escalation risk: 30%" };
assert(classifyP01AnalysisStatus(baseProvider, success) === "C_CONSTRUCT_ANALYZABLE_EPISTEMIC", "Category C fixture failed.");
assert(classifyP01AnalysisStatus(baseProvider, brittle, true) === "A_INFRASTRUCTURE_HARNESS_FAILURE", "Recoverable parser brittleness must be A.");
assert(classifyP01AnalysisStatus({ ...baseProvider, finishReason: "length" }, brittle) === "B_OUTPUT_PRODUCTION_CONTRACT_FAILURE", "Truncation must be B.");
assert(classifyP01AnalysisStatus({ ...baseProvider, technicalError: { name: "APIError", message: "fixture" } }, brittle) === "A_INFRASTRUCTURE_HARNESS_FAILURE", "Provider failure must be A.");
assert(summarizeP01RunCounts([{ attempted: true, technicallyReturned: true, analysisStatus: "C_CONSTRUCT_ANALYZABLE_EPISTEMIC" }, { attempted: true, technicallyReturned: false, analysisStatus: "A_INFRASTRUCTURE_HARNESS_FAILURE" }]).planned === 2, "Status counts fixture failed.");

const rendered = renderP01FinalModelVisible({ model_visible: { title: "Visible fixture", evidence: ["E1"] }, researcher_hidden: { expected_direction: "UP_SECRET", diagnosticity_rationale: "HIDDEN_SECRET" } });
assert(rendered.includes("Visible fixture") && !rendered.includes("HIDDEN_SECRET") && !rendered.includes("UP_SECRET"), "Final renderer boundary failed.");
assert(caseTemplate.renderer_contract.allow_root === "model_visible" && caseTemplate.renderer_contract.deny_root === "researcher_hidden", "Case Template renderer contract failed.");

const blinded = buildBlindedP01JudgeInput({ visible_case: { title: "fixture" }, candidate_output: { risk_probability: 30 }, sanitized_baseline_risk: 25 });
assert(Object.keys(blinded).sort().join(",") === "baseline_reference,candidate_output,visible_case", "Judge blinding shape failed.");
let rejectedHidden = false;
try { buildBlindedP01JudgeInput({ visible_case: { condition_code: "SD" }, candidate_output: {} }); } catch { rejectedHidden = true; }
assert(rejectedHidden, "Judge blinding accepted a forbidden field.");
assert(P01_FINAL_JUDGE_MODELS.judgeA === "gpt-5.6-terra" && P01_FINAL_JUDGE_MODELS.judgeB === "gpt-5.4-mini-2026-03-17", "Judge identities drifted.");
const result: P01JudgeResult = { judge_item_id: "fixture", judge_config_id: "P01_FINAL_JUDGES_V1.0", rubric_version: "P01_FINAL_JUDGE_RUBRIC_V1.0", criteria: {
  S1: { label: "COHERENT", rationale: "fixture", evidence_refs: ["C"], uncertain: false },
  S2: { label: "COHERENT", rationale: "fixture", evidence_refs: ["D"], uncertain: false },
  S3: { label: "NONE", rationale: "fixture", evidence_refs: ["F"], uncertain: false },
  S4: { label: "COHERENT", rationale: "fixture", evidence_refs: ["A", "G"], uncertain: false }
} };
assert(prepareJudgeScores(result, "judgeA", { run_id: "P01F_FIX", execution_attempt_id: "ATT_FIX", target_trace_id: "TRACE_FIX", target_generation_observation_id: "OBS_FIX" }).length === 4, "S1-S4 Langfuse score preparation failed.");

assert(runConfig.target_models.map((item: any) => item.model_id).join(",") === "gpt-5.6-sol,gpt-4.1-2025-04-14,kimi-k3", "Target model architecture drifted.");
assert(runConfig.portfolio.case_count === 10 && runConfig.portfolio.core === 6 && runConfig.portfolio.stress === 4, "Portfolio allocation failed.");
assert(runConfig.primary_repetitions.length === 3 && runConfig.reliability_sentinels.count === 2 && runConfig.reliability_sentinels.repetitions === 5, "Repetition/sentinel architecture failed.");
assert(runConfig.authority.future_case_count === 2 && runConfig.authority.adds_substantive_evidence === false, "Authority architecture failed.");
assert(runConfig.reference_geometry.base + runConfig.reference_geometry.authority + runConfig.reference_geometry.sentinels === 408, "Reference geometry must equal 408.");
assert(judgeConfig.judges.length === 2 && Object.keys(judgeConfig.criteria).join(",") === "S1,S2,S3,S4", "Judge configuration failed.");

const fixtures = fs.readFileSync(path.join(finalDir, "calibration_fixtures_v1.0.jsonl"), "utf8").trim().split(/\r?\n/).map((line) => JSON.parse(line));
assert(fixtures.length === 4 && new Set(fixtures.map((item) => item.type)).size === 4, "Calibration fixture set failed.");
const receipt = readJson<Record<string, any>>("langfuse_resources_v1.0.json");
assert(receipt.evaluators.length === 2 && receipt.rules.length === 2, "Langfuse resource count failed.");
for (const rule of receipt.rules) {
  assert(rule.enabled === false, "Langfuse rule must remain disabled.");
  assert(rule.filters.some((item: any) => item.key === "experiment_phase" && item.value === "P01_FINAL"), "Langfuse rule lacks P01 Final filter.");
  assert(rule.filters.some((item: any) => item.key === "protocol_version" && item.value === "P01_FINAL_PROTOCOL_V1.0"), "Langfuse rule lacks protocol filter.");
  assert(rule.filters.some((item: any) => item.key === "p01_final_rule_scope" && item.value === "P01_FINAL_ONLY"), "Langfuse rule lacks fail-closed scope filter.");
}

const envText = fs.readFileSync(resolveProjectPath(".env"), "utf8");
assert(!/^\s*(?:KIMI|MOONSHOT).*MODEL\s*=/im.test(envText) && !/kimi-k2\.7-code/i.test(envText), ".env contains a stale Kimi model override.");
assert(!fs.readdirSync(finalDir).some((name) => /^C\d\d/i.test(name)), "Concrete Block C case artifact was created.");

console.log(JSON.stringify({ status: "PASS_NO_MODEL_CALLS", formulas: "PASS", status_categories: "PASS", judge_schema_and_blinding: "PASS", langfuse_disabled_scope: "PASS", targets: runConfig.target_models.map((item: any) => item.model_id), portfolio: "10_CASES_6_CORE_4_STRESS", reference_target_generations: 408 }, null, 2));
