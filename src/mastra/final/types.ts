import type { ExecutionAttemptMetadata, ExecutionOutcomeStatus, ParsedP01Output, ProviderExecutionStatus, ProviderResult, RenderedP01Input, RunMatrixRow } from "../lib/execution_types.js";

export interface FinalRunMatrixRow {
  run_id: string;
  experiment_id: string;
  matrix_version: string;
  matrix_status: string;
  case_id: string;
  case_version: string;
  condition: string;
  repetition: string;
  provider: string;
  requested_model_id: string;
  reasoning_effort: string;
  config_profile: string;
  task_prompt_id: string;
  task_prompt_version: string;
  case_schema_version: string;
  event_id: string;
  evidence_cutoff: string;
  assessment_time: string;
  horizon_start: string;
  horizon_end: string;
  case_source_file: string;
  case_jsonl_line: string;
  case_condition_key: string;
  langfuse_experiment_tag: string;
  [key: string]: string;
}

export interface FinalCaseRecord {
  schema_id: string;
  schema_version: string;
  status: string;
  model_visible: Record<string, unknown>;
  researcher_hidden: Record<string, unknown>;
  renderer_contract: Record<string, unknown>;
}

export interface FinalSmokeManifestRow {
  smoke_run_id: string;
  source_final_run_id: string;
  case_id: string;
  condition: string;
  model_alias: string;
  requested_model_id: string;
  reasoning_effort: string;
  repetition_source: string;
  smoke_purpose: string;
  execute_in_kimi_concurrency_batch: string;
  judge_pipeline_required: string;
  accepted_as_production_run: string;
}

export interface FinalExecutionRow {
  run: FinalRunMatrixRow;
  executionRunId: string;
  sourceFinalRunId: string;
  phase: "P01_FINAL_SMOKE" | "P01_FINAL";
  executionNamespace?: string;
}

export interface FinalTargetResult {
  row: FinalExecutionRow;
  rendered: RenderedP01Input;
  providerResult: ProviderResult;
  parsed: ParsedP01Output;
  attempt: ExecutionAttemptMetadata;
  providerExecutionStatus: ProviderExecutionStatus;
  executionOutcomeStatus: ExecutionOutcomeStatus;
  rawPath: string;
  parsedPath: string;
  observabilityPath: string;
  langfuse: { ok: boolean; error?: string; traceId?: string; rootObservationId?: string; generationObservationId?: string };
  skipped: boolean;
}

export function asProviderRun(row: FinalExecutionRow): RunMatrixRow {
  const run = row.run;
  return {
    run_id: row.executionRunId,
    run_order: Number(run.run_id.match(/R(\d+)$/)?.[1] ?? 1),
    active_probe: "P01",
    package_id: `P01_FINAL_${run.case_id}`,
    case_id: run.case_id,
    case_version: run.case_version,
    base_world_id: `P01_FINAL_${run.case_id}_WORLD`,
    case_function: run.coverage_family ?? "P01_FINAL",
    variant_id: run.case_condition_key,
    condition_code: run.condition as RunMatrixRow["condition_code"],
    event_id: run.event_id,
    model_provider: run.provider,
    model_id: run.requested_model_id,
    reasoning_setting: run.reasoning_effort,
    model_config_version: run.config_profile,
    repetition: `R${String(run.repetition).padStart(2, "0")}`,
    prompt_id: run.task_prompt_id,
    prompt_version: run.task_prompt_version,
    output_schema_id: "P01_FINAL_A_G_OUTPUT",
    output_schema_version: "1.0",
    harness_version: "P01_FINAL_HARNESS_V1.0",
    case_source_path: run.case_source_file,
    raw_output_path: "",
    parsed_output_path: "",
    experiment_phase: row.phase,
    protocol_version: "P01_FINAL_PROTOCOL_V1.0",
    source_final_run_id: row.sourceFinalRunId,
    smoke_execution_id: row.executionNamespace ?? "NOT_APPLICABLE",
    p01_final_rule_scope: row.phase === "P01_FINAL" ? "P01_FINAL_ONLY" : "P01_FINAL_SMOKE_ONLY"
  };
}
