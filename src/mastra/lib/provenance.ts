import type {
  ExecutionAttemptMetadata, ExecutionOutcomeStatus, ParsedP01Output, ProviderExecutionStatus,
  ProviderResult, RenderedP01Input, RunMatrixRow
} from "./execution_types.js";

export const P01_RAW_ENVELOPE_VERSION = "P01_RAW_ENVELOPE_V1.1";
export const P01_PARSER_VERSION = "P01_OUTPUT_PARSER_V0.4";
export const P01_SCORER_VERSION = "P01_DETERMINISTIC_SCORER_V1.0";

export interface P01Provenance {
  run_id: string;
  execution_attempt_id: string;
  attempt_number: number;
  retry_of_attempt_id: string | null;
  case: { case_id: string; case_version: string; package_id: string; base_world_id: string; variant_id: string; condition_code: string; event_id: string; source_path: string; };
  prompt: { prompt_id: string; prompt_version: string; source_path: string; };
  rendered_prompt_hash: string;
  rendered_prompt_path: string;
  requested_model: string;
  returned_model: string | null;
  provider: string;
  configuration: { reasoning_setting: string; model_config_version: string; max_output_tokens: number | null; output_schema_id: string; output_schema_version: string; harness_version: string; };
  timestamps: { execution_started_at: string; execution_completed_at: string; };
  finish_reason: string | null;
  finish_reason_detail: string | null;
  token_usage: ProviderResult["usage"];
  provider_request_id: string | null;
  parser_version: string;
  scorer_version: string;
}

export function buildProvenance(run: RunMatrixRow, rendered: RenderedP01Input, result: ProviderResult, attempt: ExecutionAttemptMetadata): P01Provenance {
  const configuredTokens = Number(process.env.P01_MAX_OUTPUT_TOKENS);
  return {
    run_id: run.run_id,
    execution_attempt_id: attempt.execution_attempt_id,
    attempt_number: attempt.attempt_number,
    retry_of_attempt_id: attempt.retry_of_attempt_id,
    case: {
      case_id: run.case_id, case_version: run.case_version, package_id: run.package_id,
      base_world_id: run.base_world_id, variant_id: run.variant_id, condition_code: run.condition_code,
      event_id: run.event_id, source_path: run.case_source_path
    },
    prompt: { prompt_id: run.prompt_id, prompt_version: run.prompt_version, source_path: "experiment/P01/prompt.md" },
    rendered_prompt_hash: rendered.renderedInputHash,
    rendered_prompt_path: `outputs/rendered/P01/${run.run_id}.txt`,
    requested_model: result.requestedModelId,
    returned_model: result.returnedModelId ?? null,
    provider: result.provider,
    configuration: {
      reasoning_setting: run.reasoning_setting, model_config_version: run.model_config_version,
      max_output_tokens: Number.isInteger(configuredTokens) && configuredTokens > 0 ? configuredTokens : null,
      output_schema_id: run.output_schema_id, output_schema_version: run.output_schema_version, harness_version: run.harness_version
    },
    timestamps: { execution_started_at: attempt.execution_started_at, execution_completed_at: attempt.execution_completed_at },
    finish_reason: result.finishReason ?? null,
    finish_reason_detail: result.finishReasonDetail ?? null,
    token_usage: result.usage,
    provider_request_id: result.requestId ?? null,
    parser_version: P01_PARSER_VERSION,
    scorer_version: P01_SCORER_VERSION
  };
}

export function buildRawEnvelope(
  run: RunMatrixRow,
  rendered: RenderedP01Input,
  result: ProviderResult,
  attempt: ExecutionAttemptMetadata,
  providerExecutionStatus: ProviderExecutionStatus
) {
  return {
    schema_version: P01_RAW_ENVELOPE_VERSION,
    run_id: run.run_id,
    ...attempt,
    rendered_input_hash: rendered.renderedInputHash,
    provider: run.model_provider,
    requested_model_id: run.model_id,
    provider_execution_status: providerExecutionStatus,
    parser_version: P01_PARSER_VERSION,
    scorer_version: P01_SCORER_VERSION,
    provenance: buildProvenance(run, rendered, result, attempt),
    result
  };
}

export function buildParsedEnvelope(
  run: RunMatrixRow,
  rendered: RenderedP01Input,
  parsed: ParsedP01Output,
  attempt: ExecutionAttemptMetadata,
  executionOutcomeStatus: ExecutionOutcomeStatus
) {
  return {
    run_id: run.run_id,
    execution_attempt_id: attempt.execution_attempt_id,
    source_raw_path: run.raw_output_path,
    rendered_input_hash: rendered.renderedInputHash,
    parser_version: P01_PARSER_VERSION,
    scorer_version: P01_SCORER_VERSION,
    execution_outcome_status: executionOutcomeStatus,
    ...parsed
  };
}
