import fs from "node:fs";
import { parse } from "csv-parse/sync";
import type { ConditionCode, RunMatrixRow } from "./execution_types.js";
import { resolveProjectPath } from "./paths.js";

const REQUIRED_COLUMNS = [
  "run_id", "run_order", "active_probe", "package_id", "case_id", "case_version",
  "base_world_id", "variant_id", "condition_code", "event_id", "model_provider", "model_id",
  "reasoning_setting", "model_config_version", "repetition", "prompt_id", "prompt_version",
  "output_schema_id", "output_schema_version", "harness_version", "case_source_path",
  "raw_output_path", "parsed_output_path"
] as const;

const CONDITIONS = new Set<ConditionCode>(["BL", "SD", "WD", "ND"]);

export function loadAndValidateRunMatrix(csvPath: string): RunMatrixRow[] {
  const csv = fs.readFileSync(csvPath, "utf8");
  const rawRows = parse(csv, { columns: true, skip_empty_lines: true, bom: true }) as Record<string, string>[];
  if (rawRows.length !== 96) throw new Error(`Run Matrix must contain exactly 96 rows; found ${rawRows.length}.`);
  const headers = new Set(Object.keys(rawRows[0] ?? {}));
  const missing = REQUIRED_COLUMNS.filter((column) => !headers.has(column));
  if (missing.length) throw new Error(`Run Matrix missing required columns: ${missing.join(", ")}`);

  const runIds = new Set<string>();
  const runOrders = new Set<number>();
  const rows = rawRows.map((raw) => {
    if (raw.active_probe !== "P01") throw new Error(`Non-P01 row: ${raw.run_id}`);
    if (!CONDITIONS.has(raw.condition_code as ConditionCode)) throw new Error(`Invalid condition ${raw.condition_code}: ${raw.run_id}`);
    if (runIds.has(raw.run_id)) throw new Error(`Duplicate run_id: ${raw.run_id}`);
    runIds.add(raw.run_id);
    const runOrder = Number(raw.run_order);
    if (!Number.isInteger(runOrder) || runOrder < 1) throw new Error(`Invalid run_order: ${raw.run_id}`);
    if (runOrders.has(runOrder)) throw new Error(`Duplicate run_order: ${runOrder}`);
    runOrders.add(runOrder);
    const casePath = resolveProjectPath(raw.case_source_path);
    if (!fs.existsSync(casePath)) throw new Error(`Referenced case file missing: ${raw.case_source_path}`);
    return { ...raw, run_order: runOrder, condition_code: raw.condition_code as ConditionCode, active_probe: "P01" } as RunMatrixRow;
  });
  return rows.sort((a, b) => a.run_order - b.run_order);
}
