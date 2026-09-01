import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { loadCasePackageForRun } from "./lib/case_loader.js";
import type { ExecutionAttemptMetadata, ProviderResult, RunMatrixRow } from "./lib/execution_types.js";
import { classifyExecutionOutcome, classifyProviderExecution } from "./lib/execution_status.js";
import { createLangfuseRuntime, type LangfuseRuntime } from "./lib/langfuse.js";
import { logStatus } from "./lib/logging.js";
import { P01_PROMPT_PATH, resolveProjectPath } from "./lib/paths.js";
import { parseP01Output } from "./parsers/p01_output_parser.js";
import { buildParsedEnvelope, buildRawEnvelope } from "./lib/provenance.js";
import { KimiProvider } from "./providers/kimi.js";
import { OpenAIProvider } from "./providers/openai.js";
import type { ProviderAdapter } from "./providers/types.js";
import { renderP01Input } from "./renderers/p01_renderer.js";

function adapterFor(run: RunMatrixRow): ProviderAdapter {
  const provider = run.model_provider.toLowerCase();
  if (provider.includes("openai")) return new OpenAIProvider();
  if (provider.includes("moonshot")) return new KimiProvider();
  throw new Error(`Unsupported provider: ${run.model_provider}`);
}

function writeImmutable(filePath: string, content: string): "WRITTEN" | "ALREADY_IDENTICAL" {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  if (fs.existsSync(filePath)) {
    if (fs.readFileSync(filePath, "utf8") === content) return "ALREADY_IDENTICAL";
    throw new Error(`Provenance conflict: existing file differs: ${filePath}`);
  }
  fs.writeFileSync(filePath, content, { encoding: "utf8", flag: "wx" });
  return "WRITTEN";
}

export async function executeP01Rows(rows: RunMatrixRow[]): Promise<void> {
  const langfuse = await createLangfuseRuntime();
  try {
    for (const run of rows) await executeP01Row(run, langfuse);
  } finally { await langfuse.shutdown(); }
}

async function executeP01Row(run: RunMatrixRow, langfuse: LangfuseRuntime): Promise<void> {
  const pkg = loadCasePackageForRun(run);
  const rendered = renderP01Input(run, pkg, P01_PROMPT_PATH);
  const renderedPath = resolveProjectPath(`outputs/rendered/P01/${run.run_id}.txt`);
  writeImmutable(renderedPath, rendered.exactText);
  const rawPath = resolveProjectPath(run.raw_output_path);
  if (fs.existsSync(rawPath)) {
    const existing = JSON.parse(fs.readFileSync(rawPath, "utf8")) as { rendered_input_hash?: string };
    if (existing.rendered_input_hash !== rendered.renderedInputHash) throw new Error(`Existing raw output hash conflict: ${run.run_id}`);
    logStatus("SKIPPED_ALREADY_COMPLETE", { run_id: run.run_id });
    return;
  }
  const executionStartedAt = new Date().toISOString();
  const result: ProviderResult = await adapterFor(run).execute(run, rendered.messages);
  const attempt: ExecutionAttemptMetadata = {
    execution_attempt_id: randomUUID(),
    attempt_number: 1,
    retry_of_attempt_id: null,
    execution_started_at: executionStartedAt,
    execution_completed_at: new Date().toISOString()
  };
  const providerExecutionStatus = classifyProviderExecution(result);
  const rawEnvelope = buildRawEnvelope(run, rendered, result, attempt, providerExecutionStatus);
  writeImmutable(rawPath, `${JSON.stringify(rawEnvelope, null, 2)}\n`);
  const parsed = parseP01Output(result.text, Boolean(result.technicalError));
  const executionOutcomeStatus = classifyExecutionOutcome(result, parsed);
  const parsedPath = resolveProjectPath(run.parsed_output_path);
  writeImmutable(parsedPath, `${JSON.stringify(buildParsedEnvelope(run, rendered, parsed, attempt, executionOutcomeStatus), null, 2)}\n`);
  const trace = await langfuse.record(run, rendered, result, parsed.parsingStatus, executionOutcomeStatus, attempt);
  const observabilityPath = resolveProjectPath(`outputs/observability/P01/${run.run_id}.json`);
  writeImmutable(observabilityPath, `${JSON.stringify({ run_id: run.run_id, execution_attempt_id: attempt.execution_attempt_id, rendered_input_hash: rendered.renderedInputHash, execution_outcome_status: executionOutcomeStatus, langfuse_enabled: langfuse.enabled, langfuse_status: trace.ok ? "EMITTED" : "NOT_EMITTED", ...trace }, null, 2)}\n`);
  logStatus(executionOutcomeStatus, { run_id: run.run_id, provider_execution_status: providerExecutionStatus, parsing_status: parsed.parsingStatus, langfuse_status: trace.ok ? "EMITTED" : `NOT_EMITTED:${trace.error}` });
}
