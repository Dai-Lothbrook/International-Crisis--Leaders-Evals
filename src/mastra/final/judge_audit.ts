import fs from "node:fs";
import path from "node:path";
import { parseJudgeJson, validateJudgeExecution, type JudgeConfig, type JudgeParserProvenance } from "./judges.js";
import { FINAL_JUDGE_CONFIG_PATH } from "./loader.js";
import type { ProviderResult } from "../lib/execution_types.js";
import { P01_FINAL_JUDGE_MODELS, type JudgeIdentity, type P01JudgeExecutionEnvelope } from "../scorers/judge_types.js";

interface StoredRaw {
  judge_item_id: string;
  judge: JudgeIdentity;
  model_id: string;
  prompt: { user?: { judge_item_id?: string; judge_config_id?: string; rubric_version?: string } };
  result: ProviderResult;
}

export interface JudgeCellAudit {
  planned_unique_cells: number;
  valid_scored_unique_cells: string[];
  reusable_valid_unscored_raw_cells: string[];
  unique_cells_requiring_new_paid_calls: string[];
  unique_terminal_nonretryable_cells: string[];
  billing_quota_failure_envelopes: number;
  langfuse_fully_complete_scored_cells: number;
  langfuse_incomplete_scored_cells: number;
}

export function auditFinalJudgeStorage(outputRoot: string, planned: Array<{ itemId: string; targetRunId: string; judge: JudgeIdentity }>): JudgeCellAudit {
  if (planned.length !== 816 || new Set(planned.map((item) => item.itemId)).size !== 816) throw new Error("Expected exactly 816 unique Final judge cells.");
  const config = JSON.parse(fs.readFileSync(FINAL_JUDGE_CONFIG_PATH, "utf8")) as JudgeConfig;
  const audit: JudgeCellAudit = {
    planned_unique_cells: 816,
    valid_scored_unique_cells: [], reusable_valid_unscored_raw_cells: [], unique_cells_requiring_new_paid_calls: [], unique_terminal_nonretryable_cells: [],
    billing_quota_failure_envelopes: 0, langfuse_fully_complete_scored_cells: 0, langfuse_incomplete_scored_cells: 0
  };
  for (const { itemId, targetRunId, judge } of planned) {
    const scorePath = path.join(outputRoot, "scores", `${itemId}.json`);
    const sidecarPath = path.join(outputRoot, "scores", `${itemId}.langfuse.json`);
    if (fs.existsSync(scorePath)) {
      validateJudgeExecution(JSON.parse(fs.readFileSync(scorePath, "utf8")) as P01JudgeExecutionEnvelope, targetRunId, judge);
      audit.valid_scored_unique_cells.push(itemId);
      if (fs.existsSync(sidecarPath)) {
        const sidecar = JSON.parse(fs.readFileSync(sidecarPath, "utf8")) as { judge_trace?: { ok?: boolean }; score_emission?: { ok?: boolean } };
        if (sidecar.judge_trace?.ok && sidecar.score_emission?.ok) audit.langfuse_fully_complete_scored_cells += 1;
        else audit.langfuse_incomplete_scored_cells += 1;
      } else audit.langfuse_incomplete_scored_cells += 1;
      continue;
    }
    const initialPath = path.join(outputRoot, "raw", `${itemId}.json`);
    const retryPath = path.join(outputRoot, "raw", `${itemId}.attempt_02.json`);
    const selectedPath = fs.existsSync(retryPath) ? retryPath : fs.existsSync(initialPath) ? initialPath : undefined;
    if (!selectedPath) { audit.unique_cells_requiring_new_paid_calls.push(itemId); continue; }
    const raw = JSON.parse(fs.readFileSync(selectedPath, "utf8")) as StoredRaw;
    const result = raw.result;
    if (result.technicalError) {
      if (/credit|quota|billing|insufficient/i.test(JSON.stringify(result.technicalError))) audit.billing_quota_failure_envelopes += 1;
      if (!fs.existsSync(retryPath)) audit.unique_cells_requiring_new_paid_calls.push(itemId);
      else audit.unique_terminal_nonretryable_cells.push(itemId);
      continue;
    }
    if (result.finishReason === "incomplete" || result.finishReason === "length" || result.finishReasonDetail === "max_output_tokens" || !result.text.trim()) {
      audit.unique_terminal_nonretryable_cells.push(itemId); continue;
    }
    const provenance: JudgeParserProvenance = {
      storedItemId: raw.judge_item_id, storedJudge: raw.judge, storedModelId: raw.model_id,
      requestedModelId: result.requestedModelId, promptItemId: raw.prompt?.user?.judge_item_id,
      promptConfigId: raw.prompt?.user?.judge_config_id, promptRubricVersion: raw.prompt?.user?.rubric_version
    };
    try {
      parseJudgeJson(result.text, config, itemId, judge, result.returnedModelId ?? P01_FINAL_JUDGE_MODELS[judge], provenance);
      audit.reusable_valid_unscored_raw_cells.push(itemId);
    } catch { audit.unique_terminal_nonretryable_cells.push(itemId); }
  }
  const accounted = audit.valid_scored_unique_cells.length + audit.reusable_valid_unscored_raw_cells.length + audit.unique_cells_requiring_new_paid_calls.length + audit.unique_terminal_nonretryable_cells.length;
  if (accounted !== 816) throw new Error(`Judge-cell audit did not reconcile: ${accounted}/816.`);
  return audit;
}
