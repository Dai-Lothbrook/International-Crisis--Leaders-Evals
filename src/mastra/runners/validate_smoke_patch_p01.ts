import fs from "node:fs";
import path from "node:path";
import { parseP01Output } from "../parsers/p01_output_parser.js";
import { resolveProjectPath } from "../lib/paths.js";
import { loadAndValidateRunMatrix } from "../lib/run_matrix.js";
import { RUN_MATRIX_PATH } from "../lib/paths.js";

const historicalRunIds = ["P01_C01_BL_SOL56_R01", "P01_C01_BL_GPT41_R01"] as const;

for (const runId of historicalRunIds) {
  const rawPath = resolveProjectPath(`outputs/raw/P01/${runId}.json`);
  const raw = JSON.parse(fs.readFileSync(rawPath, "utf8")) as {
    rendered_input_hash: string;
    result: { text: string };
  };
  const parsed = parseP01Output(raw.result.text);
  if (parsed.parsingStatus !== "SUCCESS") throw new Error(`${runId}: ${parsed.parsingStatus}: ${parsed.error}`);
  if (parsed.riskProbability === undefined || parsed.confidence === undefined) throw new Error(`${runId}: risk/confidence missing.`);
  if (!parsed.markdownSections || Object.keys(parsed.markdownSections).join("") !== "ABCDEFG") throw new Error(`${runId}: A-G sections missing.`);

  const outputPath = resolveProjectPath(`outputs/parsed/P01/${runId}_parser_v0.2.json`);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const content = `${JSON.stringify({ run_id: runId, rendered_input_hash: raw.rendered_input_hash, parser_version: "v0.2", source_raw_path: `outputs/raw/P01/${runId}.json`, ...parsed }, null, 2)}\n`;
  if (fs.existsSync(outputPath) && fs.readFileSync(outputPath, "utf8") !== content) throw new Error(`Derived parse provenance conflict: ${outputPath}`);
  if (!fs.existsSync(outputPath)) fs.writeFileSync(outputPath, content, { encoding: "utf8", flag: "wx" });
  console.log(JSON.stringify({ run_id: runId, status: parsed.parsingStatus, risk: parsed.riskProbability, confidence: parsed.confidence, sections: Object.keys(parsed.markdownSections) }));
}

const rows = loadAndValidateRunMatrix(RUN_MATRIX_PATH);
const kimiRows = rows.filter((row) => row.model_provider === "Moonshot AI");
if (kimiRows.length !== 32) throw new Error(`Expected 32 Moonshot rows; found ${kimiRows.length}.`);
for (const row of kimiRows) {
  if (row.model_id !== "kimi-k2.7-code") throw new Error(`${row.run_id}: wrong Kimi model identity.`);
  if (!row.run_id.includes("KIMI27C") || !row.raw_output_path.includes("KIMI27C") || !row.parsed_output_path.includes("KIMI27C")) throw new Error(`${row.run_id}: Kimi ID/path migration incomplete.`);
  if (row.model_config_version !== "P01_ALPHA_MODEL_CONFIG_v1.1_KIMI_K2_7_CODE_CONTROLLER_DIRECTED") throw new Error(`${row.run_id}: Kimi model config version mismatch.`);
}
console.log(JSON.stringify({ matrix_status: "SUCCESS", total_rows: rows.length, kimi_rows: kimiRows.length, kimi_model_id: "kimi-k2.7-code", historical_kimi3_raw_preserved: fs.existsSync(resolveProjectPath("outputs/raw/P01/P01_C01_BL_KIMI3_R01.json")) }));
