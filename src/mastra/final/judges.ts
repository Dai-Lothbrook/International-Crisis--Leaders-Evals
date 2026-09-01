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

export interface JudgeConfig {
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
  skipped?: boolean;
}

interface StoredJudgeRaw {
  judge_item_id: string;
  judge: JudgeIdentity;
  model_id: string;
  started_at: string;
  completed_at: string;
  prompt: unknown;
  result: ProviderResult;
  judge_attempt_id?: string;
  attempt_number?: number;
  retry_of_attempt_id?: string | null;
}

export interface JudgeParserProvenance {
  storedItemId: string;
  storedJudge: JudgeIdentity;
  storedModelId: string;
  requestedModelId?: string;
  promptItemId?: string;
  promptConfigId?: string;
  promptRubricVersion?: string;
}

export type JudgeFailureClass = "PROVIDER_API_TRANSPORT" | "EMPTY_CORRUPT_RESPONSE" | "TRUNCATION_TOKEN_EXHAUSTION" | "MALFORMED_SUBSTANTIVE_ANSWER" | "PARSER_VALIDATOR_FAILURE" | "MODEL_IDENTITY_CONFIG" | "OTHER";
export interface FinalJudgeFailure {
  itemId: string;
  targetRunId: string;
  judge: JudgeIdentity;
  classification: JudgeFailureClass;
  retryable: boolean;
  paidRawExists: boolean;
  rawPath?: string;
  error: string;
}
export interface FinalJudgeBatchSummary { results: FinalJudgeResult[]; failures: FinalJudgeFailure[]; }

export async function mapConcurrentSettled<T, R, F>(items: T[], concurrency: number, execute: (item: T) => Promise<R>, onFailure: (item: T, error: unknown) => F): Promise<{ results: R[]; failures: F[] }> {
  const failures: F[] = [];
  const settled = await mapConcurrent(items, concurrency, async (item) => {
    try { return await execute(item); }
    catch (error) { failures.push(onFailure(item, error)); return undefined; }
  });
  return { results: settled.filter((item): item is R => item !== undefined), failures };
}

function judgePaths(outputRoot: string, itemId: string) {
  const root = resolveProjectPath(`${outputRoot}/judges`);
  return {
    rawPath: path.join(root, "raw", `${itemId}.json`),
    retryRawPath: path.join(root, "raw", `${itemId}.attempt_02.json`),
    scorePath: path.join(root, "scores", `${itemId}.json`),
    langfusePath: path.join(root, "scores", `${itemId}.langfuse.json`),
    failurePath: path.join(root, "failures", `${itemId}.json`)
  };
}

function latestRaw(paths: ReturnType<typeof judgePaths>): { rawPath: string; stored: StoredJudgeRaw } | undefined {
  const rawPath = fs.existsSync(paths.retryRawPath) ? paths.retryRawPath : fs.existsSync(paths.rawPath) ? paths.rawPath : undefined;
  return rawPath ? { rawPath, stored: JSON.parse(fs.readFileSync(rawPath, "utf8")) as StoredJudgeRaw } : undefined;
}

function readStoredResult(target: FinalTargetResult, judge: JudgeIdentity, paths: ReturnType<typeof judgePaths>): FinalJudgeResult {
  const execution = JSON.parse(fs.readFileSync(paths.scorePath, "utf8")) as P01JudgeExecutionEnvelope;
  validateJudgeExecution(execution, target.row.executionRunId, judge);
  const sidecar = fs.existsSync(paths.langfusePath)
    ? JSON.parse(fs.readFileSync(paths.langfusePath, "utf8")) as { judge_trace: FinalJudgeResult["judgeTrace"]; score_emission: FinalJudgeResult["scoreEmission"] }
    : undefined;
  return {
    targetRunId: target.row.executionRunId,
    judge,
    execution,
    rawPath: latestRaw(paths)?.rawPath ?? paths.rawPath,
    scorePath: paths.scorePath,
    judgeTrace: sidecar?.judge_trace ?? { ok: false, error: "Langfuse judge sidecar absent" },
    scoreEmission: sidecar?.score_emission ?? { ok: false, errors: ["Langfuse judge sidecar absent"] },
    skipped: true
  };
}

function provenanceAllowsInferredLinkage(provenance: JudgeParserProvenance | undefined, config: JudgeConfig, itemId: string, judge: JudgeIdentity, expectedModel: string): boolean {
  return Boolean(
    provenance &&
    provenance.storedItemId === itemId &&
    provenance.storedJudge === judge &&
    provenance.storedModelId === expectedModel &&
    provenance.requestedModelId === expectedModel &&
    provenance.promptItemId === itemId &&
    provenance.promptConfigId === config.config_id &&
    provenance.promptRubricVersion === config.rubric_version
  );
}

export function parseJudgeJson(text: string, config: JudgeConfig, itemId: string, judge: JudgeIdentity, returnedModelId?: string, provenance?: JudgeParserProvenance): P01JudgeResult {
  const candidate = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const decoded = JSON.parse(candidate) as P01JudgeResult | { criteria?: P01JudgeResult["criteria"] } | P01JudgeResult["criteria"];
  const expectedModel = P01_FINAL_JUDGE_MODELS[judge];
  if (!itemId.endsWith(`_${judge}`) || returnedModelId !== expectedModel) throw new Error("Judge identity/model linkage mismatch.");
  const candidateRecord = decoded as unknown as Record<string, unknown>;
  const hasIdentity = typeof candidateRecord.judge_item_id === "string";
  if (!hasIdentity && !provenanceAllowsInferredLinkage(provenance, config, itemId, judge, expectedModel)) throw new Error("Judge identity/config linkage absent and not recoverable from immutable provenance.");
  const criteria = (candidateRecord.criteria ?? (candidateRecord.S1 && candidateRecord.S2 && candidateRecord.S3 && candidateRecord.S4 ? candidateRecord : undefined)) as P01JudgeResult["criteria"] | undefined;
  const result = {
    ...(decoded as Partial<P01JudgeResult>),
    judge_item_id: hasIdentity ? candidateRecord.judge_item_id as string : itemId,
    judge_config_id: typeof candidateRecord.judge_config_id === "string" ? candidateRecord.judge_config_id : config.config_id,
    rubric_version: typeof candidateRecord.rubric_version === "string" ? candidateRecord.rubric_version : config.rubric_version,
    criteria
  } as P01JudgeResult;
  if (result.judge_item_id !== itemId) throw new Error("Judge identity/model linkage mismatch.");
  if (result.judge_config_id != null && result.judge_config_id !== config.config_id) throw new Error("Judge config linkage mismatch.");
  if (result.rubric_version != null && result.rubric_version !== config.rubric_version) throw new Error("Judge rubric linkage mismatch.");
  result.judge_config_id ??= config.config_id;
  result.rubric_version ??= config.rubric_version;
  for (const criterion of ["S1", "S2", "S3", "S4"] as const) {
    const value = result.criteria?.[criterion];
    const allowed = config.criteria[criterion]?.labels ?? [];
    if (!value || !allowed.includes(value.label) || typeof value.rationale !== "string" || !Array.isArray(value.evidence_refs) || typeof value.uncertain !== "boolean") throw new Error(`Invalid judge criterion ${criterion}.`);
  }
  return result;
}

export function validateJudgeExecution(execution: P01JudgeExecutionEnvelope, targetRunId: string, judge: JudgeIdentity): void {
  const expectedModel = P01_FINAL_JUDGE_MODELS[judge];
  if (execution.judge !== judge || execution.judge_model_id !== expectedModel || execution.target?.run_id !== targetRunId) throw new Error("Stored judge score identity/model/target mismatch.");
  const config = JSON.parse(fs.readFileSync(FINAL_JUDGE_CONFIG_PATH, "utf8")) as JudgeConfig;
  if (execution.judge_config_id !== config.config_id || execution.rubric_version !== config.rubric_version) throw new Error("Stored judge score config/rubric mismatch.");
  parseJudgeJson(JSON.stringify(execution.result), config, `${targetRunId}_${judge}`, judge, expectedModel);
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

async function executeJudge(target: FinalTargetResult, judge: JudgeIdentity, config: JudgeConfig, langfuse: Awaited<ReturnType<typeof createLangfuseRuntime>>, outputRoot: string, maxTechnicalAttempts: 1 | 2 = 1): Promise<FinalJudgeResult> {
  const targetTraceId = target.langfuse.traceId;
  const targetGenerationId = target.langfuse.generationObservationId;
  if (!targetTraceId || !targetGenerationId) throw new Error(`Judge target lacks Langfuse lineage: ${target.row.executionRunId}`);
  const itemId = `${target.row.executionRunId}_${judge}`;
  const paths = judgePaths(outputRoot, itemId);
  if (fs.existsSync(paths.rawPath) && fs.existsSync(paths.scorePath)) return readStoredResult(target, judge, paths);
  const prompt = judgePrompt(target, config, itemId);
  const modelId = P01_FINAL_JUDGE_MODELS[judge];
  let existing = latestRaw(paths);
  if (!existing) {
    const startedAt = new Date().toISOString();
    const result = await callJudge(modelId, prompt);
    const completedAt = new Date().toISOString();
    const stored: StoredJudgeRaw = { judge_item_id: itemId, judge, model_id: modelId, started_at: startedAt, completed_at: completedAt, prompt, result, judge_attempt_id: randomUUID(), attempt_number: 1, retry_of_attempt_id: null };
    writeImmutable(paths.rawPath, `${JSON.stringify(stored, null, 2)}\n`);
    existing = { rawPath: paths.rawPath, stored };
  }
  if (existing.stored.result.technicalError && maxTechnicalAttempts === 2 && existing.rawPath === paths.rawPath && !fs.existsSync(paths.retryRawPath)) {
    const startedAt = new Date().toISOString();
    const result = await callJudge(modelId, prompt);
    const completedAt = new Date().toISOString();
    const retry: StoredJudgeRaw = { judge_item_id: itemId, judge, model_id: modelId, started_at: startedAt, completed_at: completedAt, prompt, result, judge_attempt_id: randomUUID(), attempt_number: 2, retry_of_attempt_id: existing.stored.judge_attempt_id ?? null };
    writeImmutable(paths.retryRawPath, `${JSON.stringify(retry, null, 2)}\n`);
    existing = { rawPath: paths.retryRawPath, stored: retry };
  }
  const stored = existing.stored;
  const { result, started_at: startedAt, completed_at: completedAt } = stored;
  if (result.technicalError) throw new Error(`Judge provider/API failure: ${itemId}`);
  if (result.returnedModelId !== modelId) throw new Error(`Judge returned-model mismatch: ${itemId}`);
  if (result.finishReason === "incomplete" || result.finishReason === "length" || result.finishReasonDetail === "max_output_tokens") throw new Error(`Judge truncation/token exhaustion: ${itemId}`);
  if (!result.text.trim()) throw new Error(`Judge empty response: ${itemId}`);
  const execution = fs.existsSync(paths.scorePath)
    ? JSON.parse(fs.readFileSync(paths.scorePath, "utf8")) as P01JudgeExecutionEnvelope
    : {
      judge_execution_id: randomUUID(), judge, judge_model_id: modelId, judge_config_id: config.config_id,
      rubric_version: config.rubric_version, started_at: startedAt, completed_at: completedAt,
      target: { run_id: target.row.executionRunId, execution_attempt_id: target.attempt.execution_attempt_id, target_trace_id: targetTraceId, target_generation_observation_id: targetGenerationId },
      result: parseJudgeJson(result.text, config, itemId, judge, result.returnedModelId, {
        storedItemId: stored.judge_item_id,
        storedJudge: stored.judge,
        storedModelId: stored.model_id,
        requestedModelId: result.requestedModelId,
        promptItemId: (stored.prompt as { user?: { judge_item_id?: string } })?.user?.judge_item_id,
        promptConfigId: (stored.prompt as { user?: { judge_config_id?: string } })?.user?.judge_config_id,
        promptRubricVersion: (stored.prompt as { user?: { rubric_version?: string } })?.user?.rubric_version
      })
    };
  writeLocalJudgeScoreImmutable(paths.scorePath, execution);
  const judgeTrace = await langfuse.recordJudge({
    judgeExecutionId: execution.judge_execution_id, judge, judgeModelId: modelId, judgeConfigId: config.config_id,
    rubricVersion: config.rubric_version, targetRunId: target.row.executionRunId,
    targetExecutionAttemptId: target.attempt.execution_attempt_id, targetTraceId, targetGenerationObservationId: targetGenerationId,
    prompt: stored.prompt, result, parsedResult: execution.result
  });
  return { targetRunId: target.row.executionRunId, judge, execution, rawPath: existing.rawPath, scorePath: paths.scorePath, judgeTrace, scoreEmission: { ok: false, errors: ["Pending trace flush"] }, skipped: false };
}

export function classifyExistingJudgeFailure(targetRunId: string, judge: JudgeIdentity, outputRoot: string, error: unknown): FinalJudgeFailure {
  const itemId = `${targetRunId}_${judge}`;
  const paths = judgePaths(outputRoot, itemId);
  const existing = latestRaw(paths);
  const result = existing?.stored.result;
  let classification: JudgeFailureClass = "OTHER";
  if (result?.technicalError) classification = "PROVIDER_API_TRANSPORT";
  else if (result?.finishReason === "incomplete" || result?.finishReason === "length" || result?.finishReasonDetail === "max_output_tokens") classification = "TRUNCATION_TOKEN_EXHAUSTION";
  else if (result && !result.text.trim()) classification = "EMPTY_CORRUPT_RESPONSE";
  else if (result?.returnedModelId !== P01_FINAL_JUDGE_MODELS[judge]) classification = "MODEL_IDENTITY_CONFIG";
  else if (result) {
    try { JSON.parse(result.text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")); classification = "PARSER_VALIDATOR_FAILURE"; }
    catch { classification = "MALFORMED_SUBSTANTIVE_ANSWER"; }
  }
  const retryable = classification === "PROVIDER_API_TRANSPORT" && !fs.existsSync(paths.retryRawPath);
  return { itemId, targetRunId, judge, classification, retryable, paidRawExists: Boolean(existing), rawPath: existing?.rawPath, error: error instanceof Error ? error.message : String(error) };
}

export function preserveFailure(failure: FinalJudgeFailure, outputRoot: string): void {
  const paths = judgePaths(outputRoot, failure.itemId);
  writeImmutable(paths.failurePath, `${JSON.stringify({ schema_version: "P01_FINAL_JUDGE_FAILURE_V1.0", ...failure }, null, 2)}\n`);
}

async function executeSelectedJudges(targets: FinalTargetResult[], outputRoot: string, concurrency: number): Promise<FinalJudgeResult[]> {
  const config = JSON.parse(fs.readFileSync(FINAL_JUDGE_CONFIG_PATH, "utf8")) as JudgeConfig;
  if (targets.some((target) => target.parsed.parsingStatus !== "SUCCESS" || !target.langfuse.ok)) throw new Error("Every judge target must be parseable and traced before judging.");
  const jobs = targets.flatMap((target) => (["judgeA", "judgeB"] as const).map((judge) => ({ target, judge })));
  const langfuse = await createLangfuseRuntime();
  let completed: FinalJudgeResult[];
  try { completed = await mapConcurrent(jobs, concurrency, (job) => executeJudge(job.target, job.judge, config, langfuse, outputRoot)); }
  finally { await langfuse.shutdown(); }
  for (const item of completed) {
    if (item.skipped) continue;
    const envelope = buildLocalJudgeScoreEnvelope(item.execution);
    item.scoreEmission = await emitScores(envelope.langfuse_scores);
    writeImmutable(item.scorePath.replace(/\.json$/, ".langfuse.json"), `${JSON.stringify({ judge_execution_id: item.execution.judge_execution_id, judge_trace: item.judgeTrace, score_emission: item.scoreEmission }, null, 2)}\n`);
  }
  return completed;
}

export async function executeFinalSmokeJudges(targets: FinalTargetResult[], outputRoot: string): Promise<FinalJudgeResult[]> {
  const selected = targets.filter((target) => ["P01FS_C01_BL_SOL_R01", "P01FS_C10_SD_AUTH_KIMI3_R01"].includes(target.row.executionRunId));
  if (selected.length !== 2 || selected.some((target) => target.parsed.parsingStatus !== "SUCCESS" || !target.langfuse.ok)) throw new Error("Both judge-selected target outputs must be parseable and traced before judging.");
  return executeSelectedJudges(selected, outputRoot, 2);
}

export async function executeFinalProductionJudges(targets: FinalTargetResult[], outputRoot: string): Promise<FinalJudgeBatchSummary> {
  if (targets.length !== 408) throw new Error(`Final production judges require exactly 408 targets; found ${targets.length}.`);
  const config = JSON.parse(fs.readFileSync(FINAL_JUDGE_CONFIG_PATH, "utf8")) as JudgeConfig;
  if (targets.some((target) => target.parsed.parsingStatus !== "SUCCESS" || !target.langfuse.ok)) throw new Error("Every production judge target must be parseable and traced before judging.");
  const jobs = targets.flatMap((target) => (["judgeA", "judgeB"] as const).map((judge) => ({ target, judge })));
  const langfuse = await createLangfuseRuntime();
  let batch: { results: FinalJudgeResult[]; failures: FinalJudgeFailure[] };
  try {
    batch = await mapConcurrentSettled(
      jobs, 2,
      ({ target, judge }) => executeJudge(target, judge, config, langfuse, outputRoot, 2),
      ({ target, judge }, error) => {
        const failure = classifyExistingJudgeFailure(target.row.executionRunId, judge, outputRoot, error);
        preserveFailure(failure, outputRoot);
        return failure;
      }
    );
  } finally { await langfuse.shutdown(); }
  const { results, failures } = batch;
  for (const item of results) {
    if (item.skipped) continue;
    try {
      const envelope = buildLocalJudgeScoreEnvelope(item.execution);
      item.scoreEmission = await emitScores(envelope.langfuse_scores);
      writeImmutable(item.scorePath.replace(/\.json$/, ".langfuse.json"), `${JSON.stringify({ judge_execution_id: item.execution.judge_execution_id, judge_trace: item.judgeTrace, score_emission: item.scoreEmission }, null, 2)}\n`);
      if (!item.judgeTrace.ok || !item.scoreEmission.ok) throw new Error("Judge completed locally but Langfuse trace or score emission failed.");
    } catch (error) {
      const failure: FinalJudgeFailure = {
        itemId: `${item.targetRunId}_${item.judge}`,
        targetRunId: item.targetRunId,
        judge: item.judge,
        classification: "OTHER",
        retryable: true,
        paidRawExists: true,
        rawPath: item.rawPath,
        error: error instanceof Error ? error.message : String(error)
      };
      preserveFailure(failure, outputRoot);
      failures.push(failure);
    }
  }
  return { results, failures };
}
