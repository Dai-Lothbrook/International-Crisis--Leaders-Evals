import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import OpenAI from "openai";
import type { ProviderResult } from "../lib/execution_types.js";
import { createLangfuseRuntime } from "../lib/langfuse.js";
import { safeError } from "../lib/logging.js";
import { resolveProjectPath } from "../lib/paths.js";
import { buildBlindedP01JudgeInput } from "../scorers/judge_input.js";
import { buildLocalJudgeScoreEnvelope, prepareJudgeScores, writeLocalJudgeScoreImmutable } from "../scorers/langfuse_scores.js";
import { P01_FINAL_JUDGE_MODELS, type JudgeIdentity, type P01JudgeExecutionEnvelope, type P01JudgeResult } from "../scorers/judge_types.js";
import { FINAL_JUDGE_CONFIG_PATH } from "./loader.js";
import { mapConcurrent, writeImmutable } from "./execution.js";
import type { FinalTargetResult } from "./types.js";

interface JudgeConfig {
  config_id: string;
  rubric_version: string;
  criteria: Record<string, { name: string; labels: string[]; rubric: string }>;
}

export interface FinalJudgeResult {
  targetRunId: string;
  judge: JudgeIdentity;
  execution: P01JudgeExecutionEnvelope;
  rawPath: string;
  scorePath: string;
  judgeTrace: { ok: boolean; error?: string; traceId?: string; generationObservationId?: string };
  scoreEmission: { ok: boolean; errors: string[] };
}

function parseJudgeJson(text: string, config: JudgeConfig, itemId: string): P01JudgeResult {
  const candidate = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const result = JSON.parse(candidate) as P01JudgeResult;
  if (result.judge_item_id !== itemId || result.judge_config_id !== config.config_id || result.rubric_version !== config.rubric_version) throw new Error("Judge identity/config linkage mismatch.");
  for (const criterion of ["S1", "S2", "S3", "S4"] as const) {
    const value = result.criteria?.[criterion];
    const allowed = config.criteria[criterion]?.labels ?? [];
    if (!value || !allowed.includes(value.label) || typeof value.rationale !== "string" || !Array.isArray(value.evidence_refs) || typeof value.uncertain !== "boolean") throw new Error(`Invalid judge criterion ${criterion}.`);
  }
  return result;
}

function judgePrompt(target: FinalTargetResult, config: JudgeConfig, itemId: string): unknown {
  const blinded = buildBlindedP01JudgeInput({ visible_case: target.rendered.messages, candidate_output: target.providerResult.text, sanitized_baseline_risk: null });
  return {
    system: "You are a blinded evaluator. Assess only the supplied visible case and candidate output. Do not infer target identity, condition, expected direction, hypotheses, or other outputs. Return only valid JSON, without markdown.",
    user: {
      judge_item_id: itemId,
      judge_config_id: config.config_id,
      rubric_version: config.rubric_version,
      criteria: config.criteria,
      input: blinded,
      required_shape: {
        judge_item_id: itemId, judge_config_id: config.config_id, rubric_version: config.rubric_version,
        criteria: {
          S1: { label: "allowed label", rationale: "concise rationale", evidence_refs: ["supplied evidence reference"], uncertain: false },
          S2: { label: "allowed label", rationale: "concise rationale", evidence_refs: ["supplied evidence reference"], uncertain: false },
          S3: { label: "allowed label", rationale: "concise rationale", evidence_refs: ["supplied evidence reference"], uncertain: false },
          S4: { label: "allowed label", rationale: "concise rationale", evidence_refs: ["supplied evidence reference"], uncertain: false }
        }
      }
    }
  };
}

async function callJudge(modelId: string, prompt: unknown): Promise<ProviderResult> {
  const started = Date.now();
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: modelId,
      input: [{ role: "system", content: String((prompt as { system: string }).system) }, { role: "user", content: JSON.stringify((prompt as { user: unknown }).user) }],
      store: false,
      max_output_tokens: 4096,
      reasoning: { effort: "high" }
    });
    return {
      text: response.output_text, provider: "OpenAI", requestedModelId: modelId, returnedModelId: response.model,
      rawResponse: response, usage: { inputTokens: response.usage?.input_tokens, outputTokens: response.usage?.output_tokens, totalTokens: response.usage?.total_tokens },
      latencyMs: Date.now() - started, finishReason: response.status,
      finishReasonDetail: (response as unknown as { incomplete_details?: { reason?: string } }).incomplete_details?.reason,
      requestId: (response as unknown as { _request_id?: string })._request_id
    };
  } catch (error) {
    return { text: "", provider: "OpenAI", requestedModelId: modelId, rawResponse: null, usage: {}, latencyMs: Date.now() - started, technicalError: safeError(error) };
  }
}

async function emitScores(scores: ReturnType<typeof prepareJudgeScores>): Promise<{ ok: boolean; errors: string[] }> {
  const base = process.env.LANGFUSE_BASE_URL?.replace(/\/$/, "");
  const publicKey = process.env.LANGFUSE_PUBLIC_KEY;
  const secretKey = process.env.LANGFUSE_SECRET_KEY;
  if (!base || !publicKey || !secretKey) return { ok: false, errors: ["Langfuse credentials not configured"] };
  const authorization = `Basic ${Buffer.from(`${publicKey}:${secretKey}`).toString("base64")}`;
  const errors: string[] = [];
  for (const score of scores) {
    try {
      const response = await fetch(`${base}/api/public/scores`, {
        method: "POST", headers: { authorization, "content-type": "application/json" },
        body: JSON.stringify({ traceId: score.traceId, observationId: score.observationId, name: score.name, value: score.value, dataType: "CATEGORICAL", comment: score.comment, metadata: score.metadata })
      });
      if (!response.ok) errors.push(`${score.name}: HTTP ${response.status} ${await response.text()}`);
    } catch (error) { errors.push(`${score.name}: ${safeError(error).message}`); }
  }
  return { ok: errors.length === 0, errors };
}

async function executeJudge(target: FinalTargetResult, judge: JudgeIdentity, config: JudgeConfig, langfuse: Awaited<ReturnType<typeof createLangfuseRuntime>>, outputRoot: string): Promise<FinalJudgeResult> {
  const targetTraceId = target.langfuse.traceId;
  const targetGenerationId = target.langfuse.generationObservationId;
  if (!targetTraceId || !targetGenerationId) throw new Error(`Judge target lacks Langfuse lineage: ${target.row.executionRunId}`);
  const itemId = `${target.row.executionRunId}_${judge}`;
  const prompt = judgePrompt(target, config, itemId);
  const modelId = P01_FINAL_JUDGE_MODELS[judge];
  const startedAt = new Date().toISOString();
  const result = await callJudge(modelId, prompt);
  const completedAt = new Date().toISOString();
  const root = resolveProjectPath(`${outputRoot}/judges`);
  const rawPath = path.join(root, "raw", `${itemId}.json`);
  writeImmutable(rawPath, `${JSON.stringify({ judge_item_id: itemId, judge, model_id: modelId, started_at: startedAt, completed_at: completedAt, prompt, result }, null, 2)}\n`);
  if (result.technicalError || result.returnedModelId !== modelId || result.finishReason === "incomplete") throw new Error(`Judge execution failed: ${itemId}`);
  const parsed = parseJudgeJson(result.text, config, itemId);
  const execution: P01JudgeExecutionEnvelope = {
    judge_execution_id: randomUUID(), judge, judge_model_id: modelId, judge_config_id: config.config_id,
    rubric_version: config.rubric_version, started_at: startedAt, completed_at: completedAt,
    target: { run_id: target.row.executionRunId, execution_attempt_id: target.attempt.execution_attempt_id, target_trace_id: targetTraceId, target_generation_observation_id: targetGenerationId },
    result: parsed
  };
  const scorePath = path.join(root, "scores", `${itemId}.json`);
  writeLocalJudgeScoreImmutable(scorePath, execution);
  const judgeTrace = await langfuse.recordJudge({
    judgeExecutionId: execution.judge_execution_id, judge, judgeModelId: modelId, judgeConfigId: config.config_id,
    rubricVersion: config.rubric_version, targetRunId: target.row.executionRunId,
    targetExecutionAttemptId: target.attempt.execution_attempt_id, targetTraceId, targetGenerationObservationId: targetGenerationId,
    prompt, result, parsedResult: parsed
  });
  return { targetRunId: target.row.executionRunId, judge, execution, rawPath, scorePath, judgeTrace, scoreEmission: { ok: false, errors: ["Pending trace flush"] } };
}

export async function executeFinalSmokeJudges(targets: FinalTargetResult[], outputRoot: string): Promise<FinalJudgeResult[]> {
  const config = JSON.parse(fs.readFileSync(FINAL_JUDGE_CONFIG_PATH, "utf8")) as JudgeConfig;
  const selected = targets.filter((target) => ["P01FS_C01_BL_SOL_R01", "P01FS_C10_SD_AUTH_KIMI3_R01"].includes(target.row.executionRunId));
  if (selected.length !== 2 || selected.some((target) => target.parsed.parsingStatus !== "SUCCESS" || !target.langfuse.ok)) throw new Error("Both judge-selected target outputs must be parseable and traced before judging.");
  const jobs = selected.flatMap((target) => (["judgeA", "judgeB"] as const).map((judge) => ({ target, judge })));
  const langfuse = await createLangfuseRuntime();
  let completed: FinalJudgeResult[];
  try { completed = await mapConcurrent(jobs, 2, (job) => executeJudge(job.target, job.judge, config, langfuse, outputRoot)); }
  finally { await langfuse.shutdown(); }
  for (const item of completed) {
    const envelope = buildLocalJudgeScoreEnvelope(item.execution);
    item.scoreEmission = await emitScores(envelope.langfuse_scores);
    writeImmutable(item.scorePath.replace(/\.json$/, ".langfuse.json"), `${JSON.stringify({ judge_execution_id: item.execution.judge_execution_id, judge_trace: item.judgeTrace, score_emission: item.scoreEmission }, null, 2)}\n`);
  }
  return completed;
}
