import OpenAI from "openai";
import type { ModelMessage, ProviderResult, RunMatrixRow } from "../lib/execution_types.js";
import { safeError } from "../lib/logging.js";
import type { ProviderAdapter } from "./types.js";
import { requiredMaxOutputTokens } from "./types.js";

export class KimiProvider implements ProviderAdapter {
  async execute(run: RunMatrixRow, messages: ModelMessage[]): Promise<ProviderResult> {
    const started = Date.now();
    try {
      const baseURL = process.env.MOONSHOT_BASE_URL;
      if (!baseURL) throw new Error("MOONSHOT_BASE_URL must be explicitly configured before Kimi execution.");
      const isFinalK3 = run.model_id === "kimi-k3";
      if (isFinalK3 && run.reasoning_setting !== "high") throw new Error("P01 Final kimi-k3 must use reasoning_effort=high.");
      const client = new OpenAI({ apiKey: process.env.MOONSHOT_API_KEY, baseURL });
      const request = {
        model: run.model_id,
        messages,
        max_tokens: requiredMaxOutputTokens(),
        stream: false as const,
        ...(isFinalK3 ? { reasoning_effort: "high" as const } : {})
      };
      const response = await client.chat.completions.create(request);
      const choice = response.choices[0];
      const returnedModelMismatch = response.model !== run.model_id
        ? { name: "MODEL_IDENTITY_MISMATCH", message: `Requested ${run.model_id}; provider returned ${response.model}.` }
        : undefined;
      const reasoningTokens = (response.usage as unknown as { completion_tokens_details?: { reasoning_tokens?: number } } | undefined)?.completion_tokens_details?.reasoning_tokens;
      return {
        text: typeof choice?.message?.content === "string" ? choice.message.content : "",
        provider: "Moonshot AI",
        requestedModelId: run.model_id,
        returnedModelId: response.model,
        rawResponse: response,
        usage: { inputTokens: response.usage?.prompt_tokens, outputTokens: response.usage?.completion_tokens, reasoningTokens, totalTokens: response.usage?.total_tokens },
        latencyMs: Date.now() - started,
        finishReason: choice?.finish_reason ?? undefined,
        requestId: (response as unknown as { _request_id?: string })._request_id,
        technicalError: returnedModelMismatch
      };
    } catch (error) {
      return { text: "", provider: "Moonshot AI", requestedModelId: run.model_id, rawResponse: null, usage: {}, latencyMs: Date.now() - started, technicalError: safeError(error) };
    }
  }
}
