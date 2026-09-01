import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { assertAllConditionsResolve, loadCasePackageForRun } from "../lib/case_loader.js";
import type { ConditionCode } from "../lib/execution_types.js";
import { logStatus } from "../lib/logging.js";
import { OUTPUT_ROOT, P01_PROMPT_PATH, RUN_MATRIX_PATH } from "../lib/paths.js";
import { loadAndValidateRunMatrix } from "../lib/run_matrix.js";
import { assertPromptIntegrity, assertRendererSafe, renderP01Input } from "../renderers/p01_renderer.js";

function writeDryRender(filePath: string, content: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  if (fs.existsSync(filePath)) {
    if (fs.readFileSync(filePath, "utf8") === content) return;
    throw new Error(`Dry-render conflict; refusing overwrite: ${filePath}`);
  }
  fs.writeFileSync(filePath, content, { encoding: "utf8", flag: "wx" });
}

const rows = loadAndValidateRunMatrix(RUN_MATRIX_PATH);
assertAllConditionsResolve(rows);
const outputPaths: string[] = [];
for (const condition of ["BL", "SD", "WD", "ND"] as ConditionCode[]) {
  const run = rows.find((candidate) => candidate.case_id === "C01" && candidate.condition_code === condition);
  if (!run) throw new Error(`No C01/${condition} run found.`);
  const rendered = renderP01Input(run, loadCasePackageForRun(run), P01_PROMPT_PATH);
  assertRendererSafe(rendered);
  assertPromptIntegrity(rendered, P01_PROMPT_PATH);
  const outputPath = path.join(OUTPUT_ROOT, "rendered", "smoke", `C01_${condition}_P01_DRY_RENDER.txt`);
  writeDryRender(outputPath, rendered.exactText);
  outputPaths.push(outputPath);
}
const produced = fs.readdirSync(path.join(OUTPUT_ROOT, "rendered", "smoke")).filter((name) => name.endsWith("_P01_DRY_RENDER.txt"));
if (produced.length !== 4) throw new Error(`Expected exactly four dry-render files; found ${produced.length}.`);
logStatus("DRY_RENDER_COMPLETE_NO_API_CALLS", { matrix_rows: rows.length, files: outputPaths });
