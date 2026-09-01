import fs from "node:fs";
import type { ConditionCode, RunMatrixRow } from "./execution_types.js";
import { resolveProjectPath } from "./paths.js";

export type JsonRecord = Record<string, unknown>;

export interface LoadedCasePackage {
  sourcePath: string;
  records: JsonRecord[];
  packageRecord: JsonRecord;
  baseWorld: JsonRecord;
  visibleBaseline?: JsonRecord;
  variants: JsonRecord[];
}

function recordType(record: JsonRecord): string {
  return String(record.record_type ?? "");
}

function packageVersion(record: JsonRecord): string {
  return String(record.version ?? record.case_version ?? record.package_version ?? "");
}

function variantCondition(record: JsonRecord): string {
  return String(record.condition_code ?? record.treatment_code ?? "");
}

export function loadCasePackageForRun(run: RunMatrixRow): LoadedCasePackage {
  const sourcePath = resolveProjectPath(run.case_source_path);
  const records = fs.readFileSync(sourcePath, "utf8").split(/\r?\n/).filter(Boolean).map((line, index) => {
    try { return JSON.parse(line) as JsonRecord; }
    catch (error) { throw new Error(`Invalid JSONL at ${run.case_source_path}:${index + 1}: ${String(error)}`); }
  });
  const packageRecord = records.find((record) => recordType(record) === "package");
  const baseWorld = records.find((record) => recordType(record) === "base_world");
  const visibleBaseline = records.find((record) => recordType(record) === "visible_baseline");
  const variants = records.filter((record) => ["probe_1_variant", "p01_variant"].includes(recordType(record)));
  if (!packageRecord || !baseWorld) throw new Error(`Case package lacks package/base_world records: ${run.case_source_path}`);
  if (String(packageRecord.package_id) !== run.package_id) throw new Error(`package_id mismatch for ${run.run_id}`);
  if (String(baseWorld.base_world_id) !== run.base_world_id) throw new Error(`base_world_id mismatch for ${run.run_id}`);
  if (packageVersion(packageRecord) !== run.case_version) throw new Error(`case_version mismatch for ${run.run_id}: package=${packageVersion(packageRecord)} matrix=${run.case_version}`);
  const eventId = String(baseWorld.event_id ?? (baseWorld.event as JsonRecord | undefined)?.event_id ?? visibleBaseline?.event_id ?? "");
  if (eventId !== run.event_id) throw new Error(`event_id mismatch for ${run.run_id}: package=${eventId} matrix=${run.event_id}`);
  return { sourcePath, records, packageRecord, baseWorld, visibleBaseline, variants };
}

export function selectP01Variant(pkg: LoadedCasePackage, run: RunMatrixRow): JsonRecord {
  const variant = pkg.variants.find((candidate) => variantCondition(candidate) === run.condition_code && String(candidate.variant_id) === run.variant_id);
  if (!variant) throw new Error(`Variant not found for ${run.run_id}: ${run.variant_id}/${run.condition_code}`);
  return variant;
}

export function assertAllConditionsResolve(rows: RunMatrixRow[]): void {
  const representatives = new Map<string, RunMatrixRow>();
  for (const row of rows) representatives.set(`${row.case_id}:${row.condition_code}`, row);
  for (const caseId of ["C01", "C02", "C03", "C04"]) {
    for (const condition of ["BL", "SD", "WD", "ND"] as ConditionCode[]) {
      const row = representatives.get(`${caseId}:${condition}`);
      if (!row) throw new Error(`Missing matrix cell ${caseId}/${condition}`);
      selectP01Variant(loadCasePackageForRun(row), row);
    }
  }
}
