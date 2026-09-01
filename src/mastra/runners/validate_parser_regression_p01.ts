import fs from "node:fs";
import path from "node:path";
import { resolveProjectPath } from "../lib/paths.js";
import { parseP01Output } from "../parsers/p01_output_parser.js";

interface Fixture { parser_version: string; historical_roots: string[]; synthetic_variants: Array<{ id: string; risk: number; confidence: number; text: string }> }
interface HistoricalRaw { result?: { text?: string; technicalError?: unknown; finishReason?: string }; provider_execution_status?: string }

const fixturePath = resolveProjectPath("experiment/P01/final/parser_regression_fixture_v1.0.json");
const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8")) as Fixture;
const historical: Array<{ path: string; text: string }> = [];
const excludedTruncations: Array<{ path: string; finish_reason: string }> = [];

for (const relativeRoot of fixture.historical_roots) {
  const root = resolveProjectPath(relativeRoot);
  if (!fs.existsSync(root)) continue;
  const pending = [root];
  while (pending.length) {
    const current = pending.pop()!;
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const candidate = path.join(current, entry.name);
      if (entry.isDirectory()) pending.push(candidate);
      else if (entry.name.endsWith(".json")) {
        let raw: HistoricalRaw;
        try { raw = JSON.parse(fs.readFileSync(candidate, "utf8")) as HistoricalRaw; } catch { continue; }
        const text = raw.result?.text;
        const truncated = raw.provider_execution_status === "TRUNCATED_TOKEN_EXHAUSTION" || raw.result?.finishReason === "length" || raw.result?.finishReason === "incomplete";
        if (typeof text === "string" && text.trim() && truncated) excludedTruncations.push({ path: candidate, finish_reason: raw.result?.finishReason ?? raw.provider_execution_status ?? "truncated" });
        else if (typeof text === "string" && text.trim() && !raw.result?.technicalError && raw.provider_execution_status !== "PROVIDER_API_FAILURE") {
          historical.push({ path: candidate, text });
        }
      }
    }
  }
}

const historicalResults = historical.map((item) => ({ path: item.path, parsed: parseP01Output(item.text) }));
const syntheticResults = fixture.synthetic_variants.map((item) => ({
  id: item.id, expected: { risk: item.risk, confidence: item.confidence }, parsed: parseP01Output(item.text)
}));
const historicalFailures = historicalResults.filter((item) => item.parsed.parsingStatus !== "SUCCESS");
const syntheticFailures = syntheticResults.filter((item) => item.parsed.parsingStatus !== "SUCCESS" || item.parsed.riskProbability !== item.expected.risk || item.parsed.confidence !== item.expected.confidence);
const total = historicalResults.length + syntheticResults.length;
const passed = total - historicalFailures.length - syntheticFailures.length;
const report = {
  parser_version: fixture.parser_version,
  generated_at: new Date().toISOString(),
  historical_count: historicalResults.length,
  excluded_truncated_count: excludedTruncations.length,
  excluded_truncations: excludedTruncations,
  synthetic_count: syntheticResults.length,
  total, passed, pass_rate: total ? passed / total : 0,
  historical_failures: historicalFailures.map((item) => ({ path: item.path, status: item.parsed.parsingStatus, error: item.parsed.error })),
  synthetic_failures: syntheticFailures.map((item) => ({ id: item.id, status: item.parsed.parsingStatus, risk: item.parsed.riskProbability, confidence: item.parsed.confidence, error: item.parsed.error }))
};
const outputPath = resolveProjectPath("outputs/validation/P01/P01_PARSER_REGRESSION_V0.4.json");
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify(report)}\n`);
if (historicalFailures.length || syntheticFailures.length || historicalResults.length < 100) process.exitCode = 1;
