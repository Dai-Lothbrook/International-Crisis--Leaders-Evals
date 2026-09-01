import "dotenv/config";
import { executeP01Rows } from "../index.js";
import { RUN_MATRIX_PATH } from "../lib/paths.js";
import { loadAndValidateRunMatrix } from "../lib/run_matrix.js";

if (!process.argv.includes("--confirm-mini-pilot")) {
  process.stderr.write("Mini-pilot not executed. Re-run with --confirm-mini-pilot.\n");
  process.exit(2);
}
const rows = loadAndValidateRunMatrix(RUN_MATRIX_PATH).filter((row) => row.case_id === "C01");
if (rows.length !== 24) throw new Error(`Expected 24 C01 mini-pilot rows; found ${rows.length}.`);
await executeP01Rows(rows);
