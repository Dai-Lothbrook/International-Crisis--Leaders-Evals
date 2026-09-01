import fs from "node:fs";
import type { JsonRecord, LoadedCasePackage } from "./case_loader.js";
import type { RunMatrixRow } from "./execution_types.js";
import { resolveProjectPath } from "./paths.js";

export interface TreatmentWindow { start: string; end: string; visible_range: string; }
export interface CaseTemporalContract {
  assessment_time: string;
  baseline_evidence_cutoff: string;
  evidence_cutoff: string;
  evidence_cutoff_visible: string;
  horizon_end: string;
  treatment_windows: Record<string, TreatmentWindow>;
}
interface TemporalContractFile { contract_id: string; rule: string; cases: Record<string, CaseTemporalContract>; }

export const P01_TEMPORAL_CONTRACT_PATH = resolveProjectPath("experiment/P01/temporal_contract.json");

function instant(value: string, label: string): number {
  const parsed = Date.parse(value);
  if (!value || Number.isNaN(parsed)) throw new Error(`Invalid temporal value for ${label}: ${value}`);
  return parsed;
}

function sourceTime(record: JsonRecord, key: string): string {
  return typeof record[key] === "string" ? record[key] as string : "";
}

export function loadTemporalContract(): TemporalContractFile {
  return JSON.parse(fs.readFileSync(P01_TEMPORAL_CONTRACT_PATH, "utf8")) as TemporalContractFile;
}

export function assertTreatmentWindowWithinCutoff(window: TreatmentWindow, cutoff: string, label: string): void {
  const start = instant(window.start, `${label}.start`);
  const end = instant(window.end, `${label}.end`);
  const cutoffTime = instant(cutoff, `${label}.cutoff`);
  if (start > end) throw new Error(`Treatment window starts after it ends: ${label}`);
  if (end > cutoffTime) throw new Error(`Treatment evidence occurs after final evidence cutoff: ${label}`);
}

export function assertTemporalContract(pkg: LoadedCasePackage, run: RunMatrixRow, variant: JsonRecord): CaseTemporalContract {
  const contract = loadTemporalContract().cases[run.case_id];
  if (!contract) throw new Error(`No P01 temporal contract for ${run.case_id}`);
  const assessment = instant(contract.assessment_time, `${run.case_id}.assessment_time`);
  const baselineCutoff = instant(contract.baseline_evidence_cutoff, `${run.case_id}.baseline_evidence_cutoff`);
  const cutoff = instant(contract.evidence_cutoff, `${run.case_id}.evidence_cutoff`);
  const horizon = instant(contract.horizon_end, `${run.case_id}.horizon_end`);
  if (!(baselineCutoff <= cutoff && cutoff < assessment && assessment < horizon)) throw new Error(`Invalid P01 temporal ordering for ${run.case_id}`);
  for (const key of ["assessment_time", "baseline_evidence_cutoff", "horizon_end"] as const) {
    const source = sourceTime(pkg.baseWorld, key);
    if (instant(source, `${run.case_id}.base_world.${key}`) !== instant(contract[key], `${run.case_id}.contract.${key}`)) {
      throw new Error(`Temporal contract/source mismatch for ${run.case_id}.${key}`);
    }
  }
  if (run.condition_code === "BL") {
    if (contract.treatment_windows[run.variant_id]) throw new Error(`BL must not define a treatment window: ${run.run_id}`);
    return contract;
  }
  const window = contract.treatment_windows[run.variant_id];
  if (!window) throw new Error(`Missing treatment window for ${run.run_id}`);
  assertTreatmentWindowWithinCutoff(window, contract.evidence_cutoff, run.run_id);
  const heading = typeof variant.visible_heading === "string" ? variant.visible_heading : "";
  if (!heading.includes(window.visible_range)) throw new Error(`Visible treatment timestamp disagrees with temporal contract: ${run.run_id}`);
  return contract;
}

export function applyFinalEvidenceCutoff(body: string, visibleCutoff: string): string {
  const bold = /(\*\*(?:Baseline )?Evidence cutoff:\*\*)[^\r\n]*/i;
  if (bold.test(body)) return body.replace(bold, `$1 ${visibleCutoff}`);
  const inline = /(?:Baseline )?Evidence cutoff:\s*[^.\r\n]+(?=\.\s+Forecast horizon:)/i;
  if (inline.test(body)) return body.replace(inline, `Evidence cutoff: ${visibleCutoff}`);
  const plain = /(^|\n)(Baseline )?Evidence cutoff:[^\r\n]*/i;
  if (plain.test(body)) return body.replace(plain, `$1Evidence cutoff: ${visibleCutoff}`);
  throw new Error("Visible baseline lacks an evidence-cutoff field.");
}
