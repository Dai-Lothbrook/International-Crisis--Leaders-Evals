export type CoherenceLabel = "COHERENT" | "PARTIALLY_COHERENT" | "INCOHERENT";
export type UnsupportedInferenceLabel = "NONE" | "MINOR" | "MATERIAL";
export interface JudgeCriterion<T extends string> { label: T; rationale: string; evidence_refs: string[]; uncertain: boolean; }
export interface P01JudgeResult {
  judge_item_id: string;
  judge_config_id: string;
  rubric_version: string;
  criteria: {
    S1: JudgeCriterion<CoherenceLabel>;
    S2: JudgeCriterion<CoherenceLabel>;
    S3: JudgeCriterion<UnsupportedInferenceLabel>;
    S4: JudgeCriterion<CoherenceLabel>;
  };
}

export type JudgeIdentity = "judgeA" | "judgeB";

export interface JudgeTargetAssociation {
  run_id: string;
  execution_attempt_id: string;
  target_trace_id: string;
  target_generation_observation_id: string;
}

export interface P01JudgeExecutionEnvelope {
  judge_execution_id: string;
  judge: JudgeIdentity;
  judge_model_id: string;
  judge_config_id: string;
  rubric_version: string;
  started_at: string;
  completed_at: string;
  target: JudgeTargetAssociation;
  result: P01JudgeResult;
}

export const P01_FINAL_JUDGE_MODELS = {
  judgeA: "gpt-5.6-terra",
  judgeB: "gpt-5.4-mini-2026-03-17"
} as const;

export type P01JudgeCriterionId = "S1" | "S2" | "S3" | "S4";
