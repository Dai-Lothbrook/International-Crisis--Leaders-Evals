import "dotenv/config";
import { executeP01Rows } from "../index.js";
import { RUN_MATRIX_PATH } from "../lib/paths.js";
import { loadAndValidateRunMatrix } from "../lib/run_matrix.js";

const expected = {
  active_probe: "P01",
  case_id: "C01",
  condition_code: "BL",
  model_provider: "Moonshot AI",
  model_id: "kimi-k2.7-code",
  repetition: "R01",
  run_id: "P01_C01_BL_KIMI27C_R01"
} as const;

const rows = loadAndValidateRunMatrix(RUN_MATRIX_PATH);
const selected = rows.filter((row) =>
  row.active_probe === expected.active_probe
  && row.case_id === expected.case_id
  && row.condition_code === expected.condition_code
  && row.model_provider === expected.model_provider
  && row.model_id === expected.model_id
  && row.repetition === expected.repetition
);

if (selected.length !== 1) throw new Error(`Expected exactly one authorized Kimi smoke row; found ${selected.length}.`);
const [row] = selected;
if (!row || row.run_id !== expected.run_id) throw new Error(`Authorized Kimi smoke run_id mismatch: ${row?.run_id ?? "missing"}.`);
if (process.env.P01_MAX_OUTPUT_TOKENS !== "8192") throw new Error("One-cell Kimi smoke requires P01_MAX_OUTPUT_TOKENS=8192.");

console.log(JSON.stringify({ authorization_check: "PASS", selected_rows: selected.length, run_id: row.run_id, case_id: row.case_id, condition_code: row.condition_code, model_id: row.model_id, repetition: row.repetition, max_output_tokens: 8192 }));
await executeP01Rows([row]);
