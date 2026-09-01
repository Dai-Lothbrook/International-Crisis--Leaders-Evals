import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
export const PROJECT_ROOT = path.resolve(here, "../../..");
export const EXPERIMENT_ROOT = path.join(PROJECT_ROOT, "experiment");
export const OUTPUT_ROOT = path.join(PROJECT_ROOT, "outputs");
export const RUN_MATRIX_PATH = path.join(EXPERIMENT_ROOT, "runs", "P01_RUN_MATRIX.csv");
export const P01_PROMPT_PATH = path.join(EXPERIMENT_ROOT, "P01", "prompt.md");

export function resolveProjectPath(relativePath: string): string {
  const absolute = path.resolve(PROJECT_ROOT, relativePath);
  const rootWithSep = `${PROJECT_ROOT}${path.sep}`;
  if (absolute !== PROJECT_ROOT && !absolute.startsWith(rootWithSep)) {
    throw new Error(`Path escapes project root: ${relativePath}`);
  }
  return absolute;
}
