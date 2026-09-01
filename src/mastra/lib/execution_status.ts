import type { ExecutionOutcomeStatus, ParsedP01Output, ProviderExecutionStatus, ProviderResult } from "./execution_types.js";

export type P01AnalysisStatus =
  | "A_INFRASTRUCTURE_HARNESS_FAILURE"
  | "B_OUTPUT_PRODUCTION_CONTRACT_FAILURE"
  | "C_CONSTRUCT_ANALYZABLE_EPISTEMIC";

const TRUNCATION_REASONS = new Set(["length", "max_tokens", "max_output_tokens", "token_limit", "incomplete"]);

export function classifyProviderExecution(result: ProviderResult): ProviderExecutionStatus {
  if (result.technicalError) return "PROVIDER_API_FAILURE";
  const reason = `${result.finishReason ?? ""} ${result.finishReasonDetail ?? ""}`.toLowerCase();
  if ([...TRUNCATION_REASONS].some((token) => reason.includes(token))) return "TRUNCATED_TOKEN_EXHAUSTION";
  return "PROVIDER_COMPLETED";
}

export function classifyExecutionOutcome(result: ProviderResult, parsed: ParsedP01Output): ExecutionOutcomeStatus {
  const providerStatus = classifyProviderExecution(result);
  if (providerStatus === "PROVIDER_API_FAILURE") return "PROVIDER_API_FAILURE";
  if (providerStatus === "TRUNCATED_TOKEN_EXHAUSTION") return "TRUNCATED_TOKEN_EXHAUSTION";
  if (parsed.parsingStatus === "SUCCESS") return "NORMAL_COMPLETION";
  if (parsed.parsingStatus === "MODEL_OUTPUT_SCHEMA_VIOLATION") return "MALFORMED_MODEL_OUTPUT";
  return "PARSER_FAILURE";
}

export function classifyP01AnalysisStatus(result: ProviderResult, parsed: ParsedP01Output, rawRequiredFieldsRecoverable = false): P01AnalysisStatus {
  const providerStatus = classifyProviderExecution(result);
  if (providerStatus === "PROVIDER_API_FAILURE") return "A_INFRASTRUCTURE_HARNESS_FAILURE";
  if (providerStatus === "TRUNCATED_TOKEN_EXHAUSTION") return "B_OUTPUT_PRODUCTION_CONTRACT_FAILURE";
  if (parsed.parsingStatus === "SUCCESS") return "C_CONSTRUCT_ANALYZABLE_EPISTEMIC";
  if (parsed.parsingStatus === "PARSER_BUG" || parsed.parsingStatus === "TRANSPORT_CORRUPTION" || rawRequiredFieldsRecoverable) return "A_INFRASTRUCTURE_HARNESS_FAILURE";
  return "B_OUTPUT_PRODUCTION_CONTRACT_FAILURE";
}

export function summarizeP01RunCounts(statuses: Array<{ attempted: boolean; technicallyReturned: boolean; analysisStatus?: P01AnalysisStatus }>) {
  return {
    planned: statuses.length,
    attempted: statuses.filter((item) => item.attempted).length,
    technically_returned: statuses.filter((item) => item.technicallyReturned).length,
    construct_analyzable: statuses.filter((item) => item.analysisStatus === "C_CONSTRUCT_ANALYZABLE_EPISTEMIC").length
  };
}
