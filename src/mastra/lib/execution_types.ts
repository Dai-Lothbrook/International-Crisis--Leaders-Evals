export type ConditionCode = "BL" | "SD" | "WD" | "ND";

export interface RunMatrixRow {
  run_id: string;
  run_order: number;
  active_probe: "P01";
  package_id: string;
  case_id: string;
  case_version: string;
  base_world_id: string;
  case_function: string;
  variant_id: string;
  condition_code: ConditionCode;
  event_id: string;
  model_provider: string;
  model_id: string;
  reasoning_setting: string;
  model_config_version: string;
  repetition: string;
  prompt_id: string;
  prompt_version: string;
  output_schema_id: string;
  output_schema_version: string;
  harness_version: string;
  case_source_path: string;
  raw_output_path: string;
  parsed_output_path: string;
  [key: string]: string | number;
}

export interface ModelMessage {
  role: "system" | "user";
  content: string;
}

export interface RenderedP01Input {
  runId: string;
  caseId: string;
  conditionCode: ConditionCode;
  messages: ModelMessage[];
  exactText: string;
  visibleFieldProvenance: string[];
  renderedInputHash: string;
  assessmentTime: string;
  evidenceCutoff: string;
}

export interface ProviderUsage {
  inputTokens?: number;
  outputTokens?: number;
  reasoningTokens?: number;
  totalTokens?: number;
}

export interface ProviderResult {
  text: string;
  provider: string;
  requestedModelId: string;
  returnedModelId?: string;
  rawResponse: unknown;
  usage: ProviderUsage;
  latencyMs: number;
  finishReason?: string;
  finishReasonDetail?: string;
  requestId?: string;
  technicalError?: { name: string; message: string };
}

export type ProviderExecutionStatus = "PROVIDER_COMPLETED" | "TRUNCATED_TOKEN_EXHAUSTION" | "PROVIDER_API_FAILURE";
export type ExecutionOutcomeStatus =
  | "NORMAL_COMPLETION"
  | "TRUNCATED_TOKEN_EXHAUSTION"
  | "PROVIDER_API_FAILURE"
  | "MALFORMED_MODEL_OUTPUT"
  | "PARSER_FAILURE";

export interface ExecutionAttemptMetadata {
  execution_attempt_id: string;
  attempt_number: number;
  retry_of_attempt_id: string | null;
  execution_started_at: string;
  execution_completed_at: string;
}

export type ParsingStatus =
  | "SUCCESS"
  | "MODEL_OUTPUT_SCHEMA_VIOLATION"
  | "PARSER_BUG"
  | "TRANSPORT_CORRUPTION";

export interface ParsedP01Output {
  parsingStatus: ParsingStatus;
  parserPath?: "PRIMARY_JSON" | "PRIMARY_LETTERED" | "NORMALIZED_SEMANTIC_FALLBACK";
  originalResponse: string;
  riskProbability?: number;
  confidence?: number;
  pathways?: unknown[];
  evidenceUsed?: unknown[];
  uncertainties?: unknown;
  explicitInferencesAssumptions?: unknown;
  briefAssessmentSummary?: unknown;
  markdownSections?: Record<"A" | "B" | "C" | "D" | "E" | "F" | "G", string>;
  error?: string;
}
