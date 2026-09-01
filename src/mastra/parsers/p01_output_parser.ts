import type { ParsedP01Output } from "../lib/execution_types.js";

const SECTION_CODES = ["A", "B", "C", "D", "E", "F", "G"] as const;
type SectionCode = typeof SECTION_CODES[number];
type ParserPath = "PRIMARY_JSON" | "PRIMARY_LETTERED" | "NORMALIZED_SEMANTIC_FALLBACK";

interface SectionMarker { code: SectionCode; index: number; line: string; }
interface ParseAttempt { parsed?: ParsedP01Output; reason?: string; }

const LABELS: Record<SectionCode, RegExp[]> = {
  A: [/\brisk\s+(?:probability|estimate)\b/i, /\bescalation\s+risk\b/i, /\bcurrent\s+assessment\b/i, /\bprobability\s+of\s+(?:the\s+)?(?:defined\s+)?(?:escalation\s+)?event\b/i],
  B: [/\bconfidence(?:\s+in\s+(?:the\s+)?assessment)?\b/i, /\bassessment\s+confidence\b/i],
  C: [/\bkey\s+evidence\b/i, /\bevidence\s+used\b/i, /\bimportant\s+evidence\b/i, /\bkey\s+escalation\s+pathways\b/i],
  D: [/\bkey\s+(?:escalation\s+)?pathways(?:\s*\/\s*mechanisms)?\b/i, /\bpathways?\s*\/\s*mechanisms?\b/i, /\bmechanisms?\b/i, /\bevidence\s+used\b/i],
  E: [/\bkey\s+uncertaint(?:y|ies)\b/i, /\buncertaint(?:y|ies)\b/i],
  F: [/\bexplicit\s+(?:assumptions?\s*(?:\/|or)\s*inferences?|inferences?\s*(?:\/|or)\s*assumptions?)\b/i, /\bassumptions?\s*(?:\/|or)\s*inferences?\b/i, /\bepistemic\s+status\b/i],
  G: [/\bbrief\s+assessment\s+(?:rationale|summary)\b/i, /\bassessment\s+rationale\b/i, /\bsummary\s+rationale\b/i]
};

function inRange(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100;
}

export function normalizeP01Output(text: string): string {
  return text.normalize("NFKC").replace(/\r\n?/g, "\n").replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[\u2010-\u2015\u2212]/g, "-").replace(/[\uFF1A\u2236]/g, ":")
    .split("\n").map((line) => line.replace(/[ \t]+$/g, "")).join("\n").trim();
}

function plainLine(line: string): string {
  return line.replace(/^\s{0,3}#{1,6}\s*/, "").replace(/[*_`~]/g, "").replace(/^\s*>\s?/, "")
    .replace(/[ \t]+/g, " ").trim();
}

function semanticCode(label: string): SectionCode | undefined {
  const matches = SECTION_CODES.filter((code) => LABELS[code].some((pattern) => pattern.test(label)));
  return matches.length === 1 ? matches[0] : undefined;
}

function letteredMarker(line: string): { code: SectionCode } | undefined {
  const match = /^([A-G])\s*(?:[.)]|[-:])\s*(.+)$/i.exec(plainLine(line));
  if (!match) return undefined;
  return { code: match[1]!.toUpperCase() as SectionCode };
}

function semanticMarker(line: string): { code: SectionCode } | undefined {
  const plain = plainLine(line);
  const candidates = SECTION_CODES.filter((code) => LABELS[code].some((pattern) => {
    const match = pattern.exec(plain);
    if (!match || match.index !== 0) return false;
    const following = plain.slice(match[0].length);
    return /^\s*(?::|-|\)|$)/.test(following) || /^\s+\d/.test(following);
  }));
  return candidates.length === 1 ? { code: candidates[0]! } : undefined;
}

function detectSections(normalized: string, mode: "lettered" | "semantic"): ParseAttempt & { sections?: Record<SectionCode, string> } {
  const markers: SectionMarker[] = [];
  let offset = 0;
  for (const line of normalized.split("\n")) {
    const marker = mode === "lettered" ? letteredMarker(line) : (letteredMarker(line) ?? semanticMarker(line));
    if (marker) markers.push({ code: marker.code, index: offset, line });
    offset += line.length + 1;
  }
  const counts = new Map<SectionCode, number>();
  for (const marker of markers) counts.set(marker.code, (counts.get(marker.code) ?? 0) + 1);
  const missing = SECTION_CODES.filter((code) => !counts.has(code));
  const duplicate = SECTION_CODES.filter((code) => (counts.get(code) ?? 0) > 1);
  if (missing.length || duplicate.length) return { reason: `sections missing=[${missing.join(",")}] duplicate=[${duplicate.join(",")}]` };
  const sections = {} as Record<SectionCode, string>;
  const ordered = [...markers].sort((a, b) => a.index - b.index);
  for (let index = 0; index < ordered.length; index += 1) {
    const marker = ordered[index]!;
    sections[marker.code] = normalized.slice(marker.index, ordered[index + 1]?.index ?? normalized.length).trim();
  }
  return { sections };
}

function numericCandidates(section: string, code: "A" | "B"): number[] {
  const lines = section.split("\n").map(plainLine).filter(Boolean).slice(0, 8);
  const values: number[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]!;
    const labelMatch = LABELS[code].map((pattern) => pattern.exec(line)).find(Boolean);
    if (!labelMatch) continue;
    let search = line.slice(labelMatch.index + labelMatch[0].length);
    search = search.replace(/^\s*(?:\(\s*0\s*(?:-|to)\s*100\s*\))?\s*(?::|-|=)?\s*/i, "").replace(/\bout\s+of\s+100\b/gi, "");
    const direct = /^([0-9]+(?:\.[0-9]+)?)\s*%?\b/.exec(search);
    if (direct) values.push(Number(direct[1]));
    else {
      const percent = /\b([0-9]+(?:\.[0-9]+)?)\s*%/.exec(search);
      if (percent) values.push(Number(percent[1]));
    }
    if (index + 1 < lines.length && !direct) {
      const next = /^([0-9]+(?:\.[0-9]+)?)\s*%?(?:\s*\([^)]*\))?\s*$/.exec(lines[index + 1]!);
      if (next) values.push(Number(next[1]));
    }
  }
  return [...new Set(values.filter(inRange))];
}

function substantiveBody(section: string, code: SectionCode): string {
  const lines = section.split("\n");
  const first = plainLine(lines[0] ?? "");
  const marker = /^([A-G])\s*(?:[.)]|[-:])\s*(.*)$/i.exec(first);
  const label = LABELS[code].map((pattern) => pattern.exec(first)).find(Boolean);
  let inline = marker ? marker[2]! : (label ? first.slice(label.index + label[0].length) : "");
  if (marker) {
    const inlineLabel = LABELS[code].map((pattern) => pattern.exec(inline)).find(Boolean);
    if (inlineLabel) inline = inline.slice(inlineLabel.index + inlineLabel[0].length);
  }
  inline = inline.replace(/^\s*(?::|-)?\s*/, "").trim();
  return [inline, ...lines.slice(1).map(plainLine)].filter(Boolean).join("\n").trim();
}

function validateSections(original: string, sections: Record<SectionCode, string>, parserPath: ParserPath): ParseAttempt {
  const risk = numericCandidates(sections.A, "A");
  const confidence = numericCandidates(sections.B, "B");
  if (risk.length !== 1) return { reason: `risk value ${risk.length ? "ambiguous" : "missing/invalid"}: [${risk.join(",")}]` };
  if (confidence.length !== 1) return { reason: `confidence value ${confidence.length ? "ambiguous" : "missing/invalid"}: [${confidence.join(",")}]` };
  const empty = (["C", "D", "E", "F", "G"] as SectionCode[]).filter((code) => substantiveBody(sections[code], code).length < 2);
  if (empty.length) return { reason: `substantive sections empty: [${empty.join(",")}]` };
  const cHeading = plainLine(sections.C.split("\n")[0] ?? "");
  const dHeading = plainLine(sections.D.split("\n")[0] ?? "");
  const cIsPathways = /\bpathways?|mechanisms?\b/i.test(cHeading);
  const dIsEvidence = /\bevidence\b/i.test(dHeading);
  const evidenceSection: SectionCode = cIsPathways && dIsEvidence ? "D" : "C";
  const pathwaysSection: SectionCode = evidenceSection === "C" ? "D" : "C";
  return { parsed: {
    parsingStatus: "SUCCESS", parserPath, originalResponse: original, riskProbability: risk[0], confidence: confidence[0],
    evidenceUsed: [substantiveBody(sections[evidenceSection], evidenceSection)], pathways: [substantiveBody(sections[pathwaysSection], pathwaysSection)],
    uncertainties: substantiveBody(sections.E, "E"), explicitInferencesAssumptions: substantiveBody(sections.F, "F"),
    briefAssessmentSummary: substantiveBody(sections.G, "G"), markdownSections: sections
  } };
}

function firstDefined(record: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) if (record[key] != null) return record[key];
  return undefined;
}

function parseJson(original: string): ParseAttempt {
  const candidate = original.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    const value = JSON.parse(candidate) as Record<string, unknown>;
    const current = (value.current_assessment ?? value) as Record<string, unknown>;
    const risk = firstDefined(current, ["escalation_risk_probability", "risk_probability", "risk"]);
    const confidence = firstDefined(current, ["confidence_in_assessment", "confidence", "assessment_confidence"]);
    const evidence = firstDefined(value, ["key_evidence", "evidence_used", "evidenceUsed"]);
    const pathways = firstDefined(value, ["key_pathways", "pathways", "mechanisms"]);
    const uncertainty = firstDefined(value, ["key_uncertainty", "uncertainty", "uncertainties"]);
    const assumptions = firstDefined(value, ["explicit_assumptions_inferences", "explicit_inferences_assumptions", "epistemic_status", "assumptions"]);
    const rationale = firstDefined(value, ["brief_assessment_rationale", "brief_assessment_summary", "briefAssessmentSummary", "rationale"]);
    if (!inRange(risk) || !inRange(confidence) || [evidence, pathways, uncertainty, assumptions, rationale].some((item) => item == null || String(item).trim() === "")) return { reason: "JSON lacks one or more substantive A-G fields." };
    return { parsed: { parsingStatus: "SUCCESS", parserPath: "PRIMARY_JSON", originalResponse: original, riskProbability: risk, confidence, evidenceUsed: Array.isArray(evidence) ? evidence : [evidence], pathways: Array.isArray(pathways) ? pathways : [pathways], uncertainties: uncertainty, explicitInferencesAssumptions: assumptions, briefAssessmentSummary: rationale } };
  } catch { return { reason: "not valid JSON" }; }
}

export function parseP01Output(originalResponse: string, transportCorrupted = false): ParsedP01Output {
  if (transportCorrupted) return { parsingStatus: "TRANSPORT_CORRUPTION", originalResponse, error: "Provider transport failed." };
  try {
    const normalized = normalizeP01Output(originalResponse);
    if (!normalized) return { parsingStatus: "MODEL_OUTPUT_SCHEMA_VIOLATION", originalResponse, error: "Provider-completed output was empty." };
    const json = parseJson(normalized);
    if (json.parsed) return json.parsed;
    const primarySections = detectSections(normalized, "lettered");
    if (primarySections.sections) {
      const primary = validateSections(originalResponse, primarySections.sections, "PRIMARY_LETTERED");
      if (primary.parsed) return primary.parsed;
      primarySections.reason = primary.reason;
    }
    const fallbackSections = detectSections(normalized, "semantic");
    if (fallbackSections.sections) {
      const fallback = validateSections(originalResponse, fallbackSections.sections, "NORMALIZED_SEMANTIC_FALLBACK");
      if (fallback.parsed) return fallback.parsed;
      fallbackSections.reason = fallback.reason;
    }
    return { parsingStatus: "MODEL_OUTPUT_SCHEMA_VIOLATION", originalResponse,
      error: `Substantive A-G validation failed after primary and normalized fallback parsing. primary=${primarySections.reason ?? "unknown"}; fallback=${fallbackSections.reason ?? "unknown"}` };
  } catch (error) {
    return { parsingStatus: "PARSER_BUG", originalResponse, error: error instanceof Error ? error.message : String(error) };
  }
}
