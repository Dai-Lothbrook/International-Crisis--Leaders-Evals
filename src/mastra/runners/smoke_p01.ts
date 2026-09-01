import "dotenv/config";
import { executeP01Rows } from "../index.js";
import { RUN_MATRIX_PATH } from "../lib/paths.js";
import { loadAndValidateRunMatrix } from "../lib/run_matrix.js";

const modelOrder = ["gpt-5.6-sol", "gpt-4.1-2025-04-14", "kimi-k2.7-code"];
const rows = loadAndValidateRunMatrix(RUN_MATRIX_PATH);
const selected = modelOrder.map((modelId) => {
  const row = rows.find((candidate) => candidate.case_id === "C01" && candidate.condition_code === "BL" && candidate.model_id === modelId && candidate.repetition === "R01");
  if (!row) throw new Error(`Smoke cell not found for ${modelId}`);
  return row;
});
await executeP01Rows(selected);
