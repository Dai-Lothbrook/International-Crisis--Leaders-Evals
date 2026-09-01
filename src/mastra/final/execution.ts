import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { classifyExecutionOutcome, classifyProviderExecution } from "../lib/execution_status.js";
import type { ExecutionAttemptMetadata, ProviderResult, RunMatrixRow } from "../lib/execution_types.js";
import { createLangfuseRuntime, type LangfuseRuntime } from "../lib/langfuse.js";
import { resolveProjectPath } from "../lib/paths.js";
import { P01_PARSER_VERSION } from "../lib/provenance.js";
import { parseP01Output } from "../parsers/p01_output_parser.js";
import { KimiProvider } from "../providers/kimi.js";
import { OpenAIProvider } from "../providers/openai.js";
import type { ProviderAdapter } from "../providers/types.js";
import { FINAL_PROMPT_PATH, loadFinalCase } from "./loader.js";
import { renderFinalInput } from "./renderer.js";
import { asProviderRun, type FinalExecutionRow, type FinalTargetResult } from "./types.js";

export interface FinalExecutionOptions {
  outputRoot: string;
  maxTechnicalAttempts: 1 | 2;
}

function adapterFor(run: RunMatrixRow): ProviderAdapter {
  if (run.model_provider.toLowerCase().includes("openai")) return new OpenAIProvider();
  if (run.model_provider.toLowerCase().includes("moonshot")) return new KimiProvider();
  throw new Error(`Unsupported Final provider: ${run.model_provider}`);
}

export function writeImmutable(filePath: string, content: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  if (fs.existsSync(filePath)) {
    if (fs.readFileSync(filePath, "utf8") === content) return;
    throw new Error(`Immutable output conflict: ${filePath}`);
  }
  fs.writeFileSync(filePath, content, { encoding: "utf8", flag: "wx" });
}

function outputPaths(row: FinalExecutionRow, root: FinalExecutionOptions["outputRoot"]) {
  return {
    rendered: resolveProjectPath(`${root}/rendered/${row.executionRunId}.txt`),
    rawDirectory: resolveProjectPath(`${root}/raw/${row.executionRunId}`),
    parsed: resolveProjectPath(`${root}/parsed/${row.executionRunId}.json`),
    observability: resolveProjectPath(`${root}/observability/${row.executionRunId}.json`)
  };
}

function existingComplete(paths: ReturnType<typeof outputPaths>): boolean {
  const parsed = fs.existsSync(paths.parsed);
  const observability = fs.existsSync(paths.observability);
  const raw = fs.existsSync(paths.rawDirectory) && fs.readdirSync(paths.rawDirectory).some((name) => name.endsWith(".json"));
  if ([parsed, observability, raw].some(Boolean) && ![parsed, observability, raw].every(Boolean)) throw new Error(`Partial Final output state detected: ${paths.parsed}`);
  return parsed && observability && raw;
}

function retryDelay(attempt: number, result: ProviderResult): Promise<void> {
  const advertisedSeconds = /try again after\s+(\d+(?:\.\d+)?)\s+seconds?/i.exec(result.technicalError?.message ?? "")?.[1];
  const advertisedMs = advertisedSeconds ? Math.ceil(Number(advertisedSeconds) * 1000) : 0;
  const delay = Math.max(advertisedMs + 250, Math.min(8_000, 1_000 * (2 ** (attempt - 1)))) + Math.floor(Math.random() * 250);
  return new Promise((resolve) => setTimeout(resolve, delay));
}

async function executeOne(row: FinalExecutionRow, options: FinalExecutionOptions, langfuse: LangfuseRuntime): Promise<FinalTargetResult> {
  const paths = outputPaths(row, options.outputRoot);
  const record = loadFinalCase(row.run);
  const rendered = renderFinalInput(row, record, FINAL_PROMPT_PATH);
  writeImmutable(paths.rendered, rendered.exactText);
  if (existingComplete(paths)) {
    const parsedEnvelope = JSON.parse(fs.readFileSync(paths.parsed, "utf8")) as Record<string, unknown>;
    const observability = JSON.parse(fs.readFileSync(paths.observability, "utf8")) as Record<string, unknown>;
    const rawFiles = fs.readdirSync(paths.rawDirectory).filter((name) => name.endsWith(".json")).sort();
    const rawEnvelope = JSON.parse(fs.readFileSync(path.join(paths.rawDirectory, rawFiles.at(-1)!), "utf8")) as Record<string, unknown>;
    if (rawEnvelope.rendered_input_hash !== rendered.renderedInputHash) throw new Error(`Completed Final hash conflict: ${row.executionRunId}`);
    return {
      row, rendered,
      providerResult: rawEnvelope.result as ProviderResult,
      parsed: parsedEnvelope.parsed as FinalTargetResult["parsed"],
      attempt: rawEnvelope.attempt as FinalTargetResult["attempt"],
      providerExecutionStatus: rawEnvelope.provider_execution_status as FinalTargetResult["providerExecutionStatus"],
      executionOutcomeStatus: parsedEnvelope.execution_outcome_status as FinalTargetResult["executionOutcomeStatus"],
      rawPath: path.join(paths.rawDirectory, rawFiles.at(-1)!), parsedPath: paths.parsed, observabilityPath: paths.observability,
      langfuse: observability.langfuse as FinalTargetResult["langfuse"], skipped: true
    };
  }

  const providerRun = asProviderRun(row);
  let retryOf: string | null = null;
  let finalResult: ProviderResult | undefined;
  let finalAttempt: ExecutionAttemptMetadata | undefined;
  let finalRawPath = "";
  for (let attemptNumber = 1; attemptNumber <= options.maxTechnicalAttempts; attemptNumber += 1) {
    const attempt: ExecutionAttemptMetadata = {
      execution_attempt_id: randomUUID(), attempt_number: attemptNumber, retry_of_attempt_id: retryOf,
      execution_started_at: new Date().toISOString(), execution_completed_at: ""
    };
    const result = await adapterFor(providerRun).execute(providerRun, rendered.messages);
    attempt.execution_completed_at = new Date().toISOString();
    const status = classifyProviderExecution(result);
    const rawPath = path.join(paths.rawDirectory, `attempt_${String(attemptNumber).padStart(2, "0")}.json`);
    writeImmutable(rawPath, `${JSON.stringify({
      schema_version: "P01_FINAL_RAW_ENVELOPE_V1.0", phase: row.phase, run_id: row.executionRunId,
      source_final_run_id: row.sourceFinalRunId, smoke_execution_id: row.executionNamespace ?? null,
      attempt, rendered_input_hash: rendered.renderedInputHash,
      provider_execution_status: status,
      provenance: {
        run_id: row.executionRunId, source_final_run_id: row.sourceFinalRunId,
        smoke_execution_id: row.executionNamespace ?? null, case_id: row.run.case_id,
        case_version: row.run.case_version, condition: row.run.condition, case_source_file: row.run.case_source_file,
        case_jsonl_line: row.run.case_jsonl_line, prompt_id: row.run.task_prompt_id, prompt_version: row.run.task_prompt_version,
        rendered_prompt_hash: rendered.renderedInputHash, requested_model: row.run.requested_model_id,
        returned_model: result.returnedModelId ?? null, provider: row.run.provider,
        configuration: { reasoning_effort: row.run.reasoning_effort, config_profile: row.run.config_profile, max_output_tokens: 8192 },
        timestamps: { started_at: attempt.execution_started_at, completed_at: attempt.execution_completed_at },
        finish_reason: result.finishReason ?? null, finish_reason_detail: result.finishReasonDetail ?? null,
        token_usage: result.usage, provider_request_id: result.requestId ?? null,
        parser_version: P01_PARSER_VERSION, scorer_version: "P01_DETERMINISTIC_SCORER_V1.0"
      },
      result
    }, null, 2)}\n`);
    finalResult = result;
    finalAttempt = attempt;
    finalRawPath = rawPath;
    if (!result.technicalError || attemptNumber === options.maxTechnicalAttempts) break;
    retryOf = attempt.execution_attempt_id;
    await retryDelay(attemptNumber, result);
  }
  if (!finalResult || !finalAttempt) throw new Error(`No Final execution attempt produced: ${row.executionRunId}`);
  const parsed = parseP01Output(finalResult.text, Boolean(finalResult.technicalError));
  const providerExecutionStatus = classifyProviderExecution(finalResult);
  const executionOutcomeStatus = classifyExecutionOutcome(finalResult, parsed);
  writeImmutable(paths.parsed, `${JSON.stringify({
    schema_version: "P01_FINAL_PARSED_ENVELOPE_V1.0", phase: row.phase, run_id: row.executionRunId,
    source_final_run_id: row.sourceFinalRunId, smoke_execution_id: row.executionNamespace ?? null,
    execution_attempt_id: finalAttempt.execution_attempt_id,
    source_raw_path: path.relative(resolveProjectPath("."), finalRawPath).replace(/\\/g, "/"),
    rendered_input_hash: rendered.renderedInputHash, execution_outcome_status: executionOutcomeStatus, parsed
  }, null, 2)}\n`);
  const trace = await langfuse.record(providerRun, rendered, finalResult, parsed.parsingStatus, executionOutcomeStatus, finalAttempt);
  writeImmutable(paths.observability, `${JSON.stringify({
    run_id: row.executionRunId, source_final_run_id: row.sourceFinalRunId,
    execution_attempt_id: finalAttempt.execution_attempt_id, rendered_input_hash: rendered.renderedInputHash,
    phase: row.phase, smoke_execution_id: row.executionNamespace ?? null, langfuse: trace
  }, null, 2)}\n`);
  return { row, rendered, providerResult: finalResult, parsed, attempt: finalAttempt, providerExecutionStatus, executionOutcomeStatus, rawPath: finalRawPath, parsedPath: paths.parsed, observabilityPath: paths.observability, langfuse: trace, skipped: false };
}

export async function mapConcurrent<T, R>(items: T[], concurrency: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  if (!Number.isInteger(concurrency) || concurrency < 1) throw new Error("Concurrency must be a positive integer.");
  const results = new Array<R>(items.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      results[index] = await fn(items[index]!);
    }
  }));
  return results;
}

export async function executeFinalRows(rows: FinalExecutionRow[], options: FinalExecutionOptions, concurrency: number): Promise<FinalTargetResult[]> {
  const langfuse = await createLangfuseRuntime();
  try { return await mapConcurrent(rows, concurrency, (row) => executeOne(row, options, langfuse)); }
  finally { await langfuse.shutdown(); }
}
