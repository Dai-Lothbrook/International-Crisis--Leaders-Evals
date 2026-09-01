import fs from "node:fs";
import path from "node:path";
import type { JudgeIdentity, JudgeTargetAssociation, P01JudgeCriterionId, P01JudgeExecutionEnvelope, P01JudgeResult } from "./judge_types.js";

export const P01_LANGFUSE_SCORE_NAMES = {
  judgeA: { S1: "P01_FINAL_S1_EVIDENCE_USE_COHERENCE_JUDGE_A", S2: "P01_FINAL_S2_PATHWAY_COHERENCE_JUDGE_A", S3: "P01_FINAL_S3_UNSUPPORTED_INFERENCE_JUDGE_A", S4: "P01_FINAL_S4_EVIDENCE_ASSESSMENT_COHERENCE_JUDGE_A" },
  judgeB: { S1: "P01_FINAL_S1_EVIDENCE_USE_COHERENCE_JUDGE_B", S2: "P01_FINAL_S2_PATHWAY_COHERENCE_JUDGE_B", S3: "P01_FINAL_S3_UNSUPPORTED_INFERENCE_JUDGE_B", S4: "P01_FINAL_S4_EVIDENCE_ASSESSMENT_COHERENCE_JUDGE_B" }
} as const;

export interface PreparedLangfuseJudgeScore {
  name: string;
  value: string;
  comment: string;
  traceId: string;
  observationId: string;
  metadata: { run_id: string; execution_attempt_id: string; judge: JudgeIdentity; judge_item_id: string; judge_config_id: string; rubric_version: string; criterion: P01JudgeCriterionId; };
}

export function prepareJudgeScores(result: P01JudgeResult, judge: JudgeIdentity, target: JudgeTargetAssociation): PreparedLangfuseJudgeScore[] {
  return (["S1", "S2", "S3", "S4"] as const).map((criterion) => ({
    name: P01_LANGFUSE_SCORE_NAMES[judge][criterion],
    value: result.criteria[criterion].label,
    comment: result.criteria[criterion].rationale,
    traceId: target.target_trace_id,
    observationId: target.target_generation_observation_id,
    metadata: {
      run_id: target.run_id,
      execution_attempt_id: target.execution_attempt_id,
      judge,
      judge_item_id: result.judge_item_id,
      judge_config_id: result.judge_config_id,
      rubric_version: result.rubric_version,
      criterion
    }
  }));
}

export function buildLocalJudgeScoreEnvelope(execution: P01JudgeExecutionEnvelope) {
  if (execution.result.judge_config_id !== execution.judge_config_id) throw new Error("Judge config linkage mismatch.");
  if (execution.result.rubric_version !== execution.rubric_version) throw new Error("Judge rubric linkage mismatch.");
  return {
    schema_version: "P01_JUDGE_SCORE_ENVELOPE_V2",
    ...execution,
    langfuse_scores: prepareJudgeScores(execution.result, execution.judge, execution.target)
  };
}

export function writeLocalJudgeScoreImmutable(filePath: string, execution: P01JudgeExecutionEnvelope): void {
  const content = `${JSON.stringify(buildLocalJudgeScoreEnvelope(execution), null, 2)}\n`;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  if (fs.existsSync(filePath)) {
    if (fs.readFileSync(filePath, "utf8") === content) return;
    throw new Error(`Judge score provenance conflict: ${filePath}`);
  }
  fs.writeFileSync(filePath, content, { encoding: "utf8", flag: "wx" });
}
