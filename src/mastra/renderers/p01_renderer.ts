import fs from "node:fs";
import type { JsonRecord, LoadedCasePackage } from "../lib/case_loader.js";
import { selectP01Variant } from "../lib/case_loader.js";
import type { RenderedP01Input, RunMatrixRow } from "../lib/execution_types.js";
import { sha256 } from "../lib/hashing.js";
import { applyFinalEvidenceCutoff, assertTemporalContract } from "../lib/temporal_contract.js";

const FORBIDDEN_PATTERNS: RegExp[] = [
  /researcher_only/i, /expected_direction/i, /diagnosticity/i, /hidden_rationale/i,
  /source_family_id/i, /probe_?2/i, /p02/i, /high_value_request/i, /low_value_request/i,
  /experiment hypothesis/i, /scoring rules?/i, /judge instructions?/i
];

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function extractPromptSection(markdown: string, number: number): string {
  const heading = new RegExp(`^## ${number}\\.[^\\n]*(?:\\r?\\n|$)`, "m").exec(markdown);
  if (!heading || heading.index === undefined) throw new Error(`Prompt section ${number} not found.`);
  const contentStart = heading.index + heading[0].length;
  const remainder = markdown.slice(contentStart);
  const nextHeading = remainder.search(/^## \d+\./m);
  return (nextHeading < 0 ? remainder : remainder.slice(0, nextHeading)).trim();
}

function stripResponseScaffold(value: string): string {
  return value.replace(/\n+#{2,6}\s+Response instructions\s*$/i, "").trim();
}

function formatStructuredBaseline(visible: JsonRecord): { body: string; provenance: string[] } {
  const title = text(visible.title ?? visible.visible_title);
  const assessment = text(visible.assessment_time_visible ?? visible.visible_assessment_time);
  const cutoff = text(visible.evidence_cutoff_visible ?? visible.visible_evidence_cutoff);
  const horizon = text(visible.horizon_visible ?? visible.visible_horizon);
  const event = text(visible.event_to_estimate ?? visible.visible_event);
  const rules = text(visible.event_rules_visible ?? visible.visible_event_rules);
  const packet = stringArray(visible.closed_evidence_packet ?? visible.visible_baseline_packet);
  if (!title || !assessment || !cutoff || !horizon || !event || !rules || !packet.length) {
    throw new Error("Structured visible baseline is incomplete.");
  }
  return {
    body: [`# ${title}`, `**Assessment time:** ${assessment}`, `**Baseline evidence cutoff:** ${cutoff}`, `**Forecast horizon:** ${horizon}`, "## Event to estimate", event, rules, "## Closed evidence packet", packet.join("\n\n")].join("\n\n"),
    provenance: ["visible_baseline.title", "visible_baseline.assessment_time_visible|visible_assessment_time", "visible_baseline.evidence_cutoff_visible|visible_evidence_cutoff", "visible_baseline.horizon_visible|visible_horizon", "visible_baseline.event_to_estimate|visible_event", "visible_baseline.event_rules_visible|visible_event_rules", "visible_baseline.closed_evidence_packet|visible_baseline_packet"]
  };
}

function baselineFor(pkg: LoadedCasePackage): { body: string; provenance: string[] } {
  const embedded = text(pkg.baseWorld.visible_baseline_packet);
  if (embedded) return { body: stripResponseScaffold(embedded), provenance: ["base_world.visible_baseline_packet"] };
  const visibleEmbedded = text(pkg.visibleBaseline?.visible_baseline_packet);
  if (visibleEmbedded) return { body: stripResponseScaffold(visibleEmbedded), provenance: ["visible_baseline.visible_baseline_packet"] };
  if (!pkg.visibleBaseline) throw new Error("No visible baseline record found.");
  return formatStructuredBaseline(pkg.visibleBaseline);
}

export function renderP01Input(run: RunMatrixRow, pkg: LoadedCasePackage, promptPath: string): RenderedP01Input {
  const prompt = fs.readFileSync(promptPath, "utf8");
  const systemInstruction = extractPromptSection(prompt, 2);
  const userTask = extractPromptSection(prompt, 4);
  const requiredOutput = extractPromptSection(prompt, 5);
  const baseline = baselineFor(pkg);
  const variant = selectP01Variant(pkg, run);
  const temporal = assertTemporalContract(pkg, run, variant);
  const visibleHeading = text(variant.visible_heading);
  const visibleUpdate = text(variant.visible_update);
  if (run.condition_code === "BL" && (visibleHeading || visibleUpdate)) throw new Error(`BL contains a treatment update: ${run.run_id}`);
  if (run.condition_code !== "BL" && (!visibleHeading || !visibleUpdate)) throw new Error(`Treatment lacks visible heading/update: ${run.run_id}`);

  const updateBlock = run.condition_code === "BL" ? "" : `\n\n## Additional evidence\n\n### ${visibleHeading}\n\n${visibleUpdate}`;
  const temporallyBoundBaseline = applyFinalEvidenceCutoff(baseline.body, temporal.evidence_cutoff_visible);
  const userContent = `${temporallyBoundBaseline}${updateBlock}\n\n## Task and response contract\n\n${userTask}\n\n${requiredOutput}`.trim();
  const messages = [{ role: "system" as const, content: systemInstruction }, { role: "user" as const, content: userContent }];
  const exactText = messages.map((message) => `===== ${message.role.toUpperCase()} =====\n${message.content}`).join("\n\n");
  const leaks = FORBIDDEN_PATTERNS.filter((pattern) => pattern.test(exactText)).map(String);
  if (leaks.length) throw new Error(`Forbidden renderer leakage in ${run.run_id}: ${leaks.join(", ")}`);
  const provenance = [...baseline.provenance, "prompt.md#2", "prompt.md#4", "prompt.md#5"];
  if (run.condition_code !== "BL") provenance.push("selected_p01_variant.visible_heading", "selected_p01_variant.visible_update");
  return {
    runId: run.run_id,
    caseId: run.case_id,
    conditionCode: run.condition_code,
    messages,
    exactText,
    visibleFieldProvenance: provenance,
    renderedInputHash: sha256(JSON.stringify(messages)),
    assessmentTime: temporal.assessment_time,
    evidenceCutoff: temporal.evidence_cutoff
  };
}

export function assertRendererSafe(rendered: RenderedP01Input): void {
  const leaks = FORBIDDEN_PATTERNS.filter((pattern) => pattern.test(rendered.exactText));
  if (leaks.length) throw new Error(`Rendered input failed leakage scan: ${rendered.runId}`);
}

export function assertPromptIntegrity(rendered: RenderedP01Input, promptPath: string): void {
  const prompt = fs.readFileSync(promptPath, "utf8");
  const expectedSystem = extractPromptSection(prompt, 2);
  const expectedTask = extractPromptSection(prompt, 4);
  const expectedOutput = extractPromptSection(prompt, 5);
  if (rendered.messages[0]?.content !== expectedSystem) throw new Error(`System prompt integrity failure: ${rendered.runId}`);
  const user = rendered.messages[1]?.content ?? "";
  if (!user.includes(expectedTask) || !user.includes(expectedOutput)) throw new Error(`User prompt section integrity failure: ${rendered.runId}`);
  if ((user.match(/## Task and response contract/g) ?? []).length !== 1) throw new Error(`Duplicated task heading: ${rendered.runId}`);
  for (const heading of ["A. Risk Estimate", "B. Confidence", "C. Key Escalation Pathways", "D. Evidence Used", "E. Key Uncertainties", "F. Explicit Inferences or Assumptions", "G. Brief Assessment Summary"]) {
    if ((user.match(new RegExp(heading.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&"), "g")) ?? []).length !== 1) throw new Error(`Missing or duplicated response field ${heading}: ${rendered.runId}`);
  }
  if (/(?:forecast|time) hori(?!zon)/i.test(rendered.exactText)) throw new Error(`Truncated horizon token: ${rendered.runId}`);
  if (!/forecast horizon/i.test(rendered.exactText) || !/time horizon/i.test(rendered.exactText)) throw new Error(`Complete horizon phrase missing: ${rendered.runId}`);
}

export interface P01FinalCaseRecord {
  model_visible: Record<string, unknown>;
  researcher_hidden: Record<string, unknown>;
}

function containsHiddenValue(rendered: string, hidden: unknown): boolean {
  if (typeof hidden === "string") return hidden.length >= 4 && rendered.includes(hidden);
  if (Array.isArray(hidden)) return hidden.some((item) => containsHiddenValue(rendered, item));
  if (hidden && typeof hidden === "object") return Object.values(hidden as Record<string, unknown>).some((item) => containsHiddenValue(rendered, item));
  return false;
}

export function renderP01FinalModelVisible(record: P01FinalCaseRecord): string {
  if (!record.model_visible || !record.researcher_hidden) throw new Error("Final case requires model_visible and researcher_hidden.");
  const rendered = JSON.stringify(record.model_visible, null, 2);
  if (containsHiddenValue(rendered, record.researcher_hidden)) throw new Error("Researcher-hidden value leaked into Final render.");
  for (const pattern of FORBIDDEN_PATTERNS) if (pattern.test(rendered)) throw new Error(`Forbidden Final renderer key: ${pattern}`);
  return rendered;
}
