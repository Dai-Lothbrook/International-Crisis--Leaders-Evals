import type { ModelMessage, ProviderResult, RunMatrixRow } from "../lib/execution_types.js";

export interface ProviderAdapter {
  execute(run: RunMatrixRow, messages: ModelMessage[]): Promise<ProviderResult>;
}

export function requiredMaxOutputTokens(): number {
  const raw = process.env.P01_MAX_OUTPUT_TOKENS;
  const value = Number(raw);
  if (!raw || !Number.isInteger(value) || value <= 0) {
    throw new Error("P01_MAX_OUTPUT_TOKENS must be explicitly configured before target-model execution.");
  }
  return value;
}
