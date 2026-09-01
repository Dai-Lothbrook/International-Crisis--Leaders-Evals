import fs from "node:fs";
import path from "node:path";
import { classifyExecutionOutcome } from "../lib/execution_status.js";
import type { ProviderResult } from "../lib/execution_types.js";
import { resolveProjectPath } from "../lib/paths.js";
import { parseP01Output } from "../parsers/p01_output_parser.js";
import { writeImmutable } from "../final/execution.js";

const runIds = [
  "P01FS_C01_BL_SOL_R01",
  "P01FS_C01_BL_GPT41_R01",
  "P01FS_C02_SD_AUTH_KIMI3_R01"
];
const outputRoot = resolveProjectPath("outputs/smoke/P01_FINAL/reprocessed/PATCH1");
const results: Array<Record<string, unknown>> = [];

for (const runId of runIds) {
  const rawPath = resolveProjectPath(`outputs/smoke/P01_FINAL/raw/${runId}/attempt_01.json`);
  const raw = JSON.parse(fs.readFileSync(rawPath, "utf8")) as { rendered_input_hash: string; attempt: { execution_attempt_id: string }; result: ProviderResult };
  const parsed = parseP01Output(raw.result.text, Boolean(raw.result.technicalError));
  const envelope = {
    schema_version: "P01_FINAL_REPROCESSED_PARSED_ENVELOPE_V1.0", patch: "P01_FINAL_SMOKE_PATCH1",
    parser_version: "P01_OUTPUT_PARSER_V0.3", run_id: runId,
    source_raw_path: path.relative(resolveProjectPath("."), rawPath).replace(/\\/g, "/"),
    execution_attempt_id: raw.attempt.execution_attempt_id, rendered_input_hash: raw.rendered_input_hash,
    execution_outcome_status: classifyExecutionOutcome(raw.result, parsed), parsed
  };
  const outputPath = path.join(outputRoot, `${runId}.json`);
  writeImmutable(outputPath, `${JSON.stringify(envelope, null, 2)}\n`);
  results.push({ run_id: runId, parser_status: parsed.parsingStatus, risk: parsed.riskProbability ?? null, confidence: parsed.confidence ?? null, output_path: outputPath });
}

writeImmutable(path.join(outputRoot, "P01_FINAL_SMOKE_PATCH1_REPROCESS_SUMMARY.json"), `${JSON.stringify({ parser_version: "P01_OUTPUT_PARSER_V0.3", results }, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(results)}\n`);
