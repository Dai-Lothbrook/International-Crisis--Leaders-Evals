import fs from "node:fs";
import { parse } from "csv-parse/sync";
import { resolveProjectPath } from "../lib/paths.js";
import type { FinalCaseRecord, FinalRunMatrixRow, FinalSmokeManifestRow } from "./types.js";

export const FINAL_MATRIX_PATH = resolveProjectPath("experiment/runs/P01_FINAL_RUN_MATRIX_v1.0.csv");
export const FINAL_CASES_PATH = resolveProjectPath("experiment/cases/P01_FINAL_CASES_v1.0.jsonl");
export const FINAL_PROMPT_PATH = resolveProjectPath("experiment/P01/final/prompt_v1.0.md");
export const FINAL_JUDGE_CONFIG_PATH = resolveProjectPath("experiment/P01/final/judge_config_v1.0.json");
export const FINAL_SMOKE_MANIFEST_PATH = resolveProjectPath("experiment/P01/final/P01_FINAL_SMOKE_MANIFEST_v1.0.csv");

const EXPECTED_MODELS = new Map([
  ["gpt-5.6-sol", "medium"],
  ["gpt-4.1-2025-04-14", "n/a"],
  ["kimi-k3", "high"]
]);

function csvRows<T>(filePath: string): T[] {
  return parse(fs.readFileSync(filePath, "utf8"), { columns: true, skip_empty_lines: true, bom: true }) as T[];
}

export function loadFinalMatrix(): FinalRunMatrixRow[] {
  const rows = csvRows<FinalRunMatrixRow>(FINAL_MATRIX_PATH);
  if (rows.length !== 408) throw new Error(`Final Run Matrix must contain exactly 408 rows; found ${rows.length}.`);
  const ids = new Set<string>();
  for (const row of rows) {
    if (row.experiment_id !== "P01_FINAL") throw new Error(`Non-Final row: ${row.run_id}`);
    if (ids.has(row.run_id)) throw new Error(`Duplicate Final run_id: ${row.run_id}`);
    ids.add(row.run_id);
    const expectedReasoning = EXPECTED_MODELS.get(row.requested_model_id);
    if (expectedReasoning === undefined || row.reasoning_effort !== expectedReasoning) throw new Error(`Frozen model/config mismatch: ${row.run_id}`);
    if (row.case_source_file !== "experiment/P01/final/P01_FINAL_CASES_v1.0.jsonl") throw new Error(`Unexpected case source: ${row.run_id}`);
  }
  for (const model of EXPECTED_MODELS.keys()) {
    const count = rows.filter((row) => row.requested_model_id === model).length;
    if (count !== 136) throw new Error(`Expected 136 Final rows for ${model}; found ${count}.`);
  }
  return rows;
}

export function loadFinalSmokeManifest(matrix: FinalRunMatrixRow[]): { manifest: FinalSmokeManifestRow[]; sourceRows: FinalRunMatrixRow[] } {
  const manifest = csvRows<FinalSmokeManifestRow>(FINAL_SMOKE_MANIFEST_PATH);
  if (manifest.length !== 8) throw new Error(`Final smoke manifest must contain exactly 8 rows; found ${manifest.length}.`);
  if (new Set(manifest.map((row) => row.smoke_run_id)).size !== 8) throw new Error("Duplicate smoke_run_id in Final smoke manifest.");
  const sourceRows = manifest.map((smoke) => {
    if (!smoke.smoke_run_id.startsWith("P01FS_")) throw new Error(`Invalid smoke namespace: ${smoke.smoke_run_id}`);
    if (smoke.accepted_as_production_run.toLowerCase() !== "false") throw new Error(`Smoke row marked as production: ${smoke.smoke_run_id}`);
    const matches = matrix.filter((row) => row.run_id === smoke.source_final_run_id);
    if (matches.length !== 1) throw new Error(`Smoke source must resolve once: ${smoke.source_final_run_id}`);
    const source = matches[0]!;
    if (source.case_id !== smoke.case_id || source.condition !== smoke.condition || source.requested_model_id !== smoke.requested_model_id || source.reasoning_effort !== (smoke.reasoning_effort || "n/a") || source.repetition !== smoke.repetition_source) {
      throw new Error(`Smoke manifest/source mismatch: ${smoke.smoke_run_id}`);
    }
    return source;
  });
  const kimi = manifest.filter((row) => row.execute_in_kimi_concurrency_batch.toLowerCase() === "true");
  if (kimi.length !== 6 || kimi.some((row) => row.requested_model_id !== "kimi-k3" || row.reasoning_effort !== "high")) throw new Error("Final smoke must contain exactly six kimi-k3/high concurrency rows.");
  if (manifest.filter((row) => row.judge_pipeline_required.toLowerCase() === "true").length !== 2) throw new Error("Final smoke must contain exactly two judge-selected rows.");
  return { manifest, sourceRows };
}

const caseLines = fs.readFileSync(FINAL_CASES_PATH, "utf8").split(/\r?\n/).filter(Boolean);

export function loadFinalCase(row: FinalRunMatrixRow): FinalCaseRecord {
  const line = Number(row.case_jsonl_line);
  if (!Number.isInteger(line) || line < 1 || line > caseLines.length) throw new Error(`Invalid case_jsonl_line: ${row.run_id}`);
  const record = JSON.parse(caseLines[line - 1]!) as FinalCaseRecord;
  const hidden = record.researcher_hidden;
  if (record.schema_id !== "P01_FINAL_CASE_TEMPLATE" || record.schema_version !== row.case_schema_version || record.status !== "FROZEN_FINAL") throw new Error(`Final case schema/status mismatch: ${row.run_id}`);
  if (String(hidden.case_id) !== row.case_id || String(hidden.case_version) !== row.case_version || String(hidden.condition_identity) !== row.condition) throw new Error(`Final case identity mismatch: ${row.run_id}`);
  const event = record.model_visible.event as Record<string, unknown> | undefined;
  if (String(event?.event_id ?? "") !== row.event_id) throw new Error(`Final event mismatch: ${row.run_id}`);
  return record;
}
