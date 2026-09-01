import "dotenv/config";
import { executeFinalRows } from "../final/execution.js";
import { loadFinalMatrix } from "../final/loader.js";
import type { FinalExecutionRow } from "../final/types.js";
import { P01_PARSER_VERSION } from "../lib/provenance.js";

if (!process.argv.includes("--confirm-full-final")) {
  process.stderr.write("P01 Final production not executed. Re-run with --confirm-full-final.\n");
  process.exit(2);
}
if (process.env.P01_MAX_OUTPUT_TOKENS !== "8192") throw new Error("P01 Final production requires P01_MAX_OUTPUT_TOKENS=8192.");
if (P01_PARSER_VERSION !== "P01_OUTPUT_PARSER_V0.4") throw new Error(`P01 Final production requires parser v0.4; found ${P01_PARSER_VERSION}.`);
for (const name of ["OPENAI_API_KEY", "MOONSHOT_API_KEY", "MOONSHOT_BASE_URL", "LANGFUSE_PUBLIC_KEY", "LANGFUSE_SECRET_KEY", "LANGFUSE_BASE_URL"]) {
  if (!process.env[name]) throw new Error(`Required environment variable is absent: ${name}`);
}
const matrix = loadFinalMatrix();
if (matrix.length !== 408) throw new Error(`Expected exactly 408 frozen Final rows; found ${matrix.length}.`);
const rows: FinalExecutionRow[] = matrix.map((run) => ({ run, executionRunId: run.run_id, sourceFinalRunId: run.run_id, phase: "P01_FINAL" }));
const kimi = rows.filter((row) => row.run.requested_model_id === "kimi-k3");
const openai = rows.filter((row) => row.run.provider === "OpenAI");
if (kimi.length !== 136 || openai.length !== 272) throw new Error(`Final provider counts invalid: Kimi=${kimi.length}, OpenAI=${openai.length}.`);
const kimiConcurrency = 6;
if (process.env.P01_FINAL_KIMI_CONCURRENCY && Number(process.env.P01_FINAL_KIMI_CONCURRENCY) !== kimiConcurrency) {
  throw new Error("P01 Final production Kimi concurrency is frozen at 6.");
}
const openaiConcurrency = Number(process.env.P01_FINAL_OPENAI_CONCURRENCY ?? "4");
process.stdout.write(`${JSON.stringify({ confirmation: "PASS", selected_rows: rows.length, kimi_rows: kimi.length, openai_rows: openai.length, max_output_tokens: 8192, kimi_concurrency: kimiConcurrency, openai_concurrency: openaiConcurrency })}\n`);
await executeFinalRows(kimi, { outputRoot: "outputs/final/P01", maxTechnicalAttempts: 2 }, kimiConcurrency);
await executeFinalRows(openai, { outputRoot: "outputs/final/P01", maxTechnicalAttempts: 2 }, openaiConcurrency);
