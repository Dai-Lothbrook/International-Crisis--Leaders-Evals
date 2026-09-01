const FORBIDDEN_JUDGE_KEYS = new Set([
  "target_model", "target_model_id", "model_provider", "provider", "condition_code",
  "expected_direction", "expected_ordering", "performance_hypothesis", "other_outputs"
]);

export interface P01JudgeInputSource {
  visible_case: unknown;
  candidate_output: unknown;
  sanitized_baseline_risk?: number | null;
}

export interface P01BlindedJudgeInput {
  visible_case: unknown;
  candidate_output: unknown;
  baseline_reference: { risk_probability: number } | null;
}

function assertNoForbiddenKeys(value: unknown): void {
  if (!value || typeof value !== "object") return;
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (FORBIDDEN_JUDGE_KEYS.has(key.toLowerCase())) throw new Error(`Forbidden judge field: ${key}`);
    assertNoForbiddenKeys(nested);
  }
}

export function buildBlindedP01JudgeInput(source: P01JudgeInputSource): P01BlindedJudgeInput {
  assertNoForbiddenKeys(source.visible_case);
  assertNoForbiddenKeys(source.candidate_output);
  if (source.sanitized_baseline_risk != null && (!Number.isFinite(source.sanitized_baseline_risk) || source.sanitized_baseline_risk < 0 || source.sanitized_baseline_risk > 100)) throw new Error("Sanitized baseline risk must be in [0, 100].");
  return {
    visible_case: source.visible_case,
    candidate_output: source.candidate_output,
    baseline_reference: source.sanitized_baseline_risk == null ? null : { risk_probability: source.sanitized_baseline_risk }
  };
}
