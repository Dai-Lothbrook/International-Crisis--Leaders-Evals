import type { ExecutionAttemptMetadata, ExecutionOutcomeStatus, ProviderResult, RenderedP01Input, RunMatrixRow } from "./execution_types.js";
import { safeError } from "./logging.js";

export interface LangfuseRuntime {
  enabled: boolean;
  record(run: RunMatrixRow, rendered: RenderedP01Input, result: ProviderResult, parsingStatus: string, executionOutcomeStatus: ExecutionOutcomeStatus, attempt: ExecutionAttemptMetadata): Promise<{ ok: boolean; error?: string; traceId?: string; rootObservationId?: string; generationObservationId?: string }>;
  recordJudge(input: {
    judgeExecutionId: string; judge: string; judgeModelId: string; judgeConfigId: string; rubricVersion: string;
    targetRunId: string; targetExecutionAttemptId: string; targetTraceId: string; targetGenerationObservationId: string;
    prompt: unknown; result: ProviderResult; parsedResult: unknown;
  }): Promise<{ ok: boolean; error?: string; traceId?: string; generationObservationId?: string }>;
  shutdown(): Promise<void>;
}

export async function createLangfuseRuntime(): Promise<LangfuseRuntime> {
  const configured = Boolean(process.env.LANGFUSE_PUBLIC_KEY && process.env.LANGFUSE_SECRET_KEY && process.env.LANGFUSE_BASE_URL);
  if (!configured) return { enabled: false, async record() { return { ok: false, error: "Langfuse credentials not configured" }; }, async recordJudge() { return { ok: false, error: "Langfuse credentials not configured" }; }, async shutdown() {} };
  try {
    const [{ NodeSDK }, { LangfuseSpanProcessor }, tracing] = await Promise.all([
      import("@opentelemetry/sdk-node"), import("@langfuse/otel"), import("@langfuse/tracing")
    ]);
    const sdk = new NodeSDK({ spanProcessors: [new LangfuseSpanProcessor()] });
    sdk.start();
    return {
      enabled: true,
      async record(run, rendered, result, parsingStatus, executionOutcomeStatus, attempt) {
        try {
          const isFinalProduction = run.experiment_phase === "P01_FINAL" && run.protocol_version === "P01_FINAL_PROTOCOL_V1.0";
          const isFinalSmoke = run.experiment_phase === "P01_FINAL_SMOKE" && run.protocol_version === "P01_FINAL_PROTOCOL_V1.0";
          const isFinal = isFinalProduction || isFinalSmoke;
          const phase = isFinalSmoke ? "P01_FINAL_SMOKE" : isFinalProduction ? "P01_FINAL" : "P01_ALPHA";
          const traceName = isFinalSmoke ? "p01-final-smoke-target-run" : isFinalProduction ? "p01-final-target-run" : "p01-target-run";
          const metadata = Object.fromEntries(Object.entries({
            run_id: run.run_id, run_order: run.run_order, active_probe: run.active_probe, case_id: run.case_id,
            case_version: run.case_version, package_id: run.package_id, base_world_id: run.base_world_id,
            variant_id: run.variant_id, condition_code: run.condition_code, model_provider: run.model_provider,
            model_id: run.model_id, model_config_version: run.model_config_version, reasoning_setting: run.reasoning_setting,
            repetition: run.repetition, prompt_version: run.prompt_version, output_schema_version: run.output_schema_version,
            harness_version: run.harness_version, rendered_input_hash: rendered.renderedInputHash,
            execution_attempt_id: attempt.execution_attempt_id, attempt_number: attempt.attempt_number,
            retry_of_attempt_id: attempt.retry_of_attempt_id ?? "", execution_started_at: attempt.execution_started_at,
            execution_completed_at: attempt.execution_completed_at, latency_ms: result.latencyMs, provider_request_id: result.requestId ?? "",
            finish_reason: result.finishReason ?? "", parsing_status: parsingStatus,
            execution_outcome_status: executionOutcomeStatus,
            technical_error_status: result.technicalError ? "TECHNICAL_FAILED" : "NONE",
            experiment_phase: phase,
            protocol_version: isFinal ? "P01_FINAL_PROTOCOL_V1.0" : String(run.protocol_version ?? "ALPHA"),
            p01_final_rule_scope: isFinalProduction ? "P01_FINAL_ONLY" : isFinalSmoke ? "P01_FINAL_SMOKE_ONLY" : "NOT_P01_FINAL",
            judge_baseline_reference: String(run.judge_baseline_reference ?? "NOT_APPLICABLE")
            ,smoke_execution_id: String(run.smoke_execution_id ?? "NOT_APPLICABLE")
          }).map(([key, value]) => [key, String(value)]));
          const tags = isFinalSmoke ? ["P01_FINAL_SMOKE", "P01_FINAL_PROTOCOL_V1.0"] : isFinalProduction ? ["P01_FINAL", "P01_FINAL_PROTOCOL_V1.0"] : ["P01_ALPHA"];
          const identifiers = await tracing.propagateAttributes({ traceName, metadata, version: run.harness_version, tags }, async () => {
            return tracing.startActiveObservation(traceName, async (root) => {
              root.update({ input: rendered.messages, output: { parsingStatus, technicalError: result.technicalError ?? null }, metadata });
              const generationObservationId = await tracing.startActiveObservation("target-model-generation", async (generation) => {
                generation.update({ model: result.returnedModelId ?? result.requestedModelId, input: rendered.messages, output: result.text, usageDetails: { input: result.usage.inputTokens ?? 0, output: result.usage.outputTokens ?? 0, reasoning: result.usage.reasoningTokens ?? 0, total: result.usage.totalTokens ?? 0 }, metadata });
                return generation.id;
              }, { asType: "generation" });
              return { traceId: root.traceId, rootObservationId: root.id, generationObservationId };
            });
          });
          return { ok: true, ...identifiers };
        } catch (error) { return { ok: false, error: safeError(error).message }; }
      },
      async recordJudge(input) {
        try {
          const metadata = Object.fromEntries(Object.entries({
            experiment_phase: "P01_FINAL_SMOKE", protocol_version: "P01_FINAL_PROTOCOL_V1.0",
            p01_final_rule_scope: "P01_FINAL_SMOKE_ONLY", judge_execution_id: input.judgeExecutionId,
            judge: input.judge, judge_model_id: input.judgeModelId, judge_config_id: input.judgeConfigId,
            rubric_version: input.rubricVersion, target_run_id: input.targetRunId,
            target_execution_attempt_id: input.targetExecutionAttemptId, target_trace_id: input.targetTraceId,
            target_generation_observation_id: input.targetGenerationObservationId
          }).map(([key, value]) => [key, String(value)]));
          const identifiers = await tracing.propagateAttributes({
            traceName: "p01-final-smoke-judge-run", metadata, version: input.rubricVersion,
            tags: ["P01_FINAL_SMOKE", "P01_FINAL_JUDGE"]
          }, async () => tracing.startActiveObservation("p01-final-smoke-judge-run", async (root) => {
            root.update({ input: input.prompt, output: input.parsedResult, metadata });
            const generationObservationId = await tracing.startActiveObservation("judge-model-generation", async (generation) => {
              generation.update({
                model: input.result.returnedModelId ?? input.result.requestedModelId, input: input.prompt,
                output: input.result.text, usageDetails: {
                  input: input.result.usage.inputTokens ?? 0, output: input.result.usage.outputTokens ?? 0,
                  reasoning: input.result.usage.reasoningTokens ?? 0, total: input.result.usage.totalTokens ?? 0
                }, metadata
              });
              return generation.id;
            }, { asType: "generation" });
            return { traceId: root.traceId, generationObservationId };
          }));
          return { ok: true, ...identifiers };
        } catch (error) { return { ok: false, error: safeError(error).message }; }
      },
      async shutdown() { try { await sdk.shutdown(); } catch { /* local outputs remain authoritative */ } }
    };
  } catch (error) {
    return { enabled: false, async record() { return { ok: false, error: safeError(error).message }; }, async recordJudge() { return { ok: false, error: safeError(error).message }; }, async shutdown() {} };
  }
}
