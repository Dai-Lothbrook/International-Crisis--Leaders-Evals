import "dotenv/config";
import { executeP01Rows } from "../index.js";
import { RUN_MATRIX_PATH } from "../lib/paths.js";
import { loadAndValidateRunMatrix } from "../lib/run_matrix.js";

if (!process.argv.includes("--confirm-full-alpha")) {
  process.stderr.write("Full Alpha not executed. Re-run with --confirm-full-alpha.\n");
  process.exit(2);
}
const rows = loadAndValidateRunMatrix(RUN_MATRIX_PATH);
if (rows.length !== 96) throw new Error(`Expected 96 rows; found ${rows.length}.`);
await executeP01Rows(rows);
