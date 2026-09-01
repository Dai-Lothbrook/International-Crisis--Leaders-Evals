import fs from "node:fs";
import type { ModelMessage, RenderedP01Input } from "../lib/execution_types.js";
import { sha256 } from "../lib/hashing.js";
import type { FinalCaseRecord, FinalExecutionRow } from "./types.js";

function section(markdown: string, heading: string): string {
  const pattern = new RegExp(`^## ${heading}\\s*$`, "mi");
  const match = pattern.exec(markdown);
  if (!match || match.index === undefined) throw new Error(`Final prompt section missing: ${heading}`);
  const start = match.index + match[0].length;
  const rest = markdown.slice(start);
  const next = rest.search(/^## /m);
  return (next < 0 ? rest : rest.slice(0, next)).trim();
}

function iso(value: unknown, label: string): Date {
  const date = new Date(String(value));
  if (Number.isNaN(date.valueOf())) throw new Error(`Invalid Final ${label}.`);
  return date;
}

function visiblePayload(record: FinalCaseRecord): Record<string, unknown> {
  const visible = record.model_visible;
  const title = String(visible.title ?? "").replace(/\s*\[(?:BL|WD|SD|ND|BL_AUTH|SD_AUTH)\]\s*$/i, "");
  const packet = Array.isArray(visible.closed_evidence_packet) ? visible.closed_evidence_packet : [];
  const neutralPacket = packet.map((item, index) => {
    const source = item as Record<string, unknown>;
    return {
      evidence_number: index + 1,
      timestamp: source.timestamp,
      source_class: source.source_class,
      source_provenance: source.source_provenance,
      reliability_notes: source.reliability_notes,
      content: source.content
    };
  });
  return {
    title,
    assessment_time: visible.assessment_time,
    evidence_cutoff: visible.evidence_cutoff,
    forecast_horizon: visible.forecast_horizon,
    event: visible.event,
    actors: visible.actors,
    closed_evidence_packet: neutralPacket,
    ...(visible.authority_statement ? { authority_statement: visible.authority_statement } : {})
  };
}

export function renderFinalInput(row: FinalExecutionRow, record: FinalCaseRecord, promptPath: string): RenderedP01Input {
  const visible = visiblePayload(record);
  const cutoff = iso(visible.evidence_cutoff, "evidence cutoff");
  const assessment = iso(visible.assessment_time, "assessment time");
  const horizon = visible.forecast_horizon as Record<string, unknown>;
  const horizonStart = iso(horizon?.start, "horizon start");
  const horizonEnd = iso(horizon?.end, "horizon end");
  if (!(cutoff < assessment && assessment.valueOf() === horizonStart.valueOf() && assessment < horizonEnd)) throw new Error(`Final temporal contract failed: ${row.executionRunId}`);
  for (const item of visible.closed_evidence_packet as Array<Record<string, unknown>>) {
    if (iso(item.timestamp, "evidence timestamp") > cutoff) throw new Error(`Post-cutoff evidence in ${row.executionRunId}`);
  }
  if (cutoff.toISOString() !== new Date(row.run.evidence_cutoff).toISOString() || assessment.toISOString() !== new Date(row.run.assessment_time).toISOString() || horizonEnd.toISOString() !== new Date(row.run.horizon_end).toISOString()) throw new Error(`Matrix/case temporal mismatch: ${row.executionRunId}`);
  const prompt = fs.readFileSync(promptPath, "utf8");
  const system = section(prompt, "System instruction");
  const task = section(prompt, "User task");
  const required = section(prompt, "Required output");
  const visibleJson = JSON.stringify(visible, null, 2);
  if (/researcher_hidden|expected_direction|expected_ordering|diagnosticity_rationale|condition_identity|treatment_label|C\d{2}-(?:BL|WD|SD|ND)/i.test(visibleJson)) throw new Error(`Hidden/condition metadata leaked in ${row.executionRunId}`);
  const messages: ModelMessage[] = [
    { role: "system", content: system },
    { role: "user", content: `# Closed evidence case\n\n${visibleJson}\n\n# Task\n\n${task}\n\n# Required output\n\n${required}` }
  ];
  const exactText = messages.map((message) => `===== ${message.role.toUpperCase()} =====\n${message.content}`).join("\n\n");
  return {
    runId: row.executionRunId,
    caseId: row.run.case_id,
    conditionCode: row.run.condition as RenderedP01Input["conditionCode"],
    messages,
    exactText,
    visibleFieldProvenance: ["model_visible allowlist", "prompt_v1.0.md"],
    renderedInputHash: sha256(JSON.stringify(messages)),
    assessmentTime: String(visible.assessment_time),
    evidenceCutoff: String(visible.evidence_cutoff)
  };
}
