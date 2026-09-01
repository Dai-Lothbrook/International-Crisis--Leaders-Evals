import OpenAI from "openai";
import type { ModelMessage, ProviderResult, RunMatrixRow } from "../lib/execution_types.js";
import { safeError } from "../lib/logging.js";
import type { ProviderAdapter } from "./types.js";
import { requiredMaxOutputTokens } from "./types.js";

export class OpenAIProvider implements ProviderAdapter {
  async execute(run: RunMatrixRow, messages: ModelMessage[]): Promise<ProviderResult> {
    const started = Date.now();
    try {
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const response = await client.responses.create({
        model: run.model_id,
        input: messages,
        store: false,
        max_output_tokens: requiredMaxOutputTokens(),
        ...(run.reasoning_setting === "medium" ? { reasoning: { effort: "medium" as const } } : {})
      });
      const usage = response.usage;
      const incompleteReason = (response as unknown as { incomplete_details?: { reason?: string } }).incomplete_details?.reason;
      return {
        text: response.output_text,
        provider: "OpenAI",
        requestedModelId: run.model_id,
        returnedModelId: response.model,
        rawResponse: response,
        usage: { inputTokens: usage?.input_tokens, outputTokens: usage?.output_tokens, totalTokens: usage?.total_tokens },
        latencyMs: Date.now() - started,
        finishReason: response.status,
        finishReasonDetail: incompleteReason,
        requestId: (response as unknown as { _request_id?: string })._request_id
      };
    } catch (error) {
      return { text: "", provider: "OpenAI", requestedModelId: run.model_id, rawResponse: null, usage: {}, latencyMs: Date.now() - started, technicalError: safeError(error) };
    }
  }
}
