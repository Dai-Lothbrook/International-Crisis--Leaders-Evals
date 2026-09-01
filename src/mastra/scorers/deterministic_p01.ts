export interface ConditionSummary {
  risk: number;
  confidence: number;
  repetition?: string;
}

export type CaseDirection = 1 | -1;
export type P01Condition = "BL" | "SD" | "WD" | "ND";
export type RepetitionInput = ConditionSummary | ConditionSummary[];

function finite(value: number, label: string): number {
  if (!Number.isFinite(value)) throw new Error(`${label} must be finite.`);
  return value;
}

export function median(values: number[]): number {
  if (!values.length) throw new Error("Median requires at least one valid value.");
  const ordered = values.map((value) => finite(value, "Median value")).sort((a, b) => a - b);
  const middle = Math.floor(ordered.length / 2);
  return ordered.length % 2 ? ordered[middle] : (ordered[middle - 1] + ordered[middle]) / 2;
}

function repetitions(value: RepetitionInput): ConditionSummary[] {
  const items = Array.isArray(value) ? value : [value];
  if (!items.length) throw new Error("Every P01 cell requires at least one valid repetition.");
  return items.map((item) => ({ ...item, risk: finite(item.risk, "Risk"), confidence: finite(item.confidence, "Confidence") }));
}

export function scoreP01Conditions(values: Record<P01Condition, RepetitionInput>, direction: CaseDirection) {
  const reps = Object.fromEntries((Object.keys(values) as P01Condition[]).map((condition) => [condition, repetitions(values[condition])])) as Record<P01Condition, ConditionSummary[]>;
  const cellRisk = Object.fromEntries((Object.keys(reps) as P01Condition[]).map((condition) => [condition, median(reps[condition].map((item) => item.risk))])) as Record<P01Condition, number>;
  const cellConfidence = Object.fromEntries((Object.keys(reps) as P01Condition[]).map((condition) => [condition, median(reps[condition].map((item) => item.confidence))])) as Record<P01Condition, number>;
  const deltaRisk = { SD: cellRisk.SD - cellRisk.BL, WD: cellRisk.WD - cellRisk.BL, ND: cellRisk.ND - cellRisk.BL };
  const directedResponse = { SD: direction * deltaRisk.SD, WD: direction * deltaRisk.WD };
  const ndDrift = Math.abs(deltaRisk.ND);
  const label = (value: number) => value > 0 ? "EXPECTED_DIRECTION" : value < 0 ? "WRONG_DIRECTION" : "NO_MOVEMENT";
  const crossRepetitionDelta = (treatment: "SD" | "WD" | "ND") => reps[treatment].flatMap((treatmentRep) => reps.BL.map((baselineRep) => ({
    treatment_repetition: treatmentRep.repetition ?? null,
    baseline_repetition: baselineRep.repetition ?? null,
    delta_risk: treatmentRep.risk - baselineRep.risk
  })));
  const sdWdPairwiseOrdering = reps.SD.flatMap((sdRep) => reps.WD.map((wdRep) => {
    const difference = direction * (sdRep.risk - wdRep.risk);
    return { sd_repetition: sdRep.repetition ?? null, wd_repetition: wdRep.repetition ?? null, directed_difference: difference, ordering: difference > 0 ? "ORDERED" : difference < 0 ? "REVERSED" : "TIED" };
  }));
  return {
    repetitionLevel: reps,
    cellRisk,
    cellConfidence,
    deltaRisk,
    directedResponse,
    diagnosticDirection: { SD: label(directedResponse.SD), WD: label(directedResponse.WD) },
    diagnosticOrdering: directedResponse.SD > directedResponse.WD ? "ORDERED" : directedResponse.SD < directedResponse.WD ? "REVERSED" : "TIED",
    ndDrift,
    signedNdDrift: deltaRisk.ND,
    diagnosticSeparation: directedResponse.SD - directedResponse.WD,
    selectivityGap: directedResponse.SD - ndDrift,
    selectivityGapWd: directedResponse.WD - ndDrift,
    crossRepetitionDelta: { SD: crossRepetitionDelta("SD"), WD: crossRepetitionDelta("WD"), ND: crossRepetitionDelta("ND") },
    sdWdPairwiseOrdering,
    confidenceDelta: { SD: cellConfidence.SD - cellConfidence.BL, WD: cellConfidence.WD - cellConfidence.BL, ND: cellConfidence.ND - cellConfidence.BL }
  };
}

export function dispersion(values: number[]) {
  if (!values.length) throw new Error("Dispersion requires at least one value.");
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.length > 1 ? values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length - 1) : 0;
  return { values, mean, sampleStandardDeviation: Math.sqrt(variance), range: Math.max(...values) - Math.min(...values) };
}
