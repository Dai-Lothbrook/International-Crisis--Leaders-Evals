import fs from "node:fs";
import path from "node:path";
import {
  classifyExistingJudgeFailure,
  mapConcurrentSettled,
  parseJudgeJson,
  preserveFailure,
  type JudgeConfig
} from "../final/judges.js";
import { FINAL_JUDGE_CONFIG_PATH } from "../final/loader.js";
import type { JudgeIdentity } from "../scorers/judge_types.js";
import { resolveProjectPath } from "../lib/paths.js";

interface StoredRaw {
  judge_item_id: string;
  judge: JudgeIdentity;
  model_id: string;
  prompt?: { user?: { judge_item_id?: string; judge_config_id?: string; rubric_version?: string } };
  result: { text: string; requestedModelId?: string; returnedModelId?: string; finishReason?: string; finishReasonDetail?: string; technicalError?: unknown };
}

const outputRoot = "outputs/final/P01";
const config = JSON.parse(fs.readFileSync(FINAL_JUDGE_CONFIG_PATH, "utf8")) as JudgeConfig;
const corpora = [
  resolveProjectPath("outputs/final/P01/judges/raw"),
  resolveProjectPath("outputs/smoke/P01_FINAL/P01_FINAL_SMOKE_002/judges/raw")
].filter(fs.existsSync);

const records = corpora.flatMap((directory) =>
  fs.readdirSync(directory)
    .filter((name) => name.endsWith(".json"))
    .map((name) => ({ path: path.join(directory, name), raw: JSON.parse(fs.readFileSync(path.join(directory, name), "utf8")) as StoredRaw }))
);

let recoverable = 0;
let parsed = 0;
const observed: Array<{ file: string; status: string; reason?: string }> = [];
for (const { path: rawPath, raw } of records) {
  const result = raw.result;
  if (result.technicalError || result.finishReason === "incomplete" || result.finishReason === "length" || result.finishReasonDetail === "max_output_tokens" || !result.text?.trim()) {
    observed.push({ file: rawPath, status: "NONRECOVERABLE_PROVIDER_RESULT" });
    continue;
  }
  recoverable += 1;
  try {
    parseJudgeJson(result.text, config, raw.judge_item_id, raw.judge, result.returnedModelId, {
      storedItemId: raw.judge_item_id,
      storedJudge: raw.judge,
      storedModelId: raw.model_id,
      requestedModelId: result.requestedModelId,
      promptItemId: raw.prompt?.user?.judge_item_id,
      promptConfigId: raw.prompt?.user?.judge_config_id,
      promptRubricVersion: raw.prompt?.user?.rubric_version
    });
    parsed += 1;
    observed.push({ file: rawPath, status: "PASS" });
  } catch (error) {
    observed.push({ file: rawPath, status: "FAIL", reason: error instanceof Error ? error.message : String(error) });
  }
}

if (parsed !== recoverable) throw new Error(`Historical judge regression failed: ${parsed}/${recoverable}.`);

const exemplarRecord = records.find(({ raw }) => raw.result.text?.trim() && raw.judge === "judgeB") ?? records.find(({ raw }) => raw.result.text?.trim());
if (!exemplarRecord) throw new Error("No completed judge RAW is available for deterministic regression.");
const exemplar = exemplarRecord.raw;
const parsedExemplar = JSON.parse(exemplar.result.text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")) as Record<string, unknown>;
const exactModel = exemplar.result.returnedModelId;
if (!exactModel) throw new Error("Regression exemplar lacks returned model identity.");

const expectPass = (value: unknown, label: string) => {
  parseJudgeJson(JSON.stringify(value), config, exemplar.judge_item_id, exemplar.judge, exactModel);
  return label;
};
const expectFail = (value: unknown, label: string, returnedModel = exactModel) => {
  let failed = false;
  try { parseJudgeJson(JSON.stringify(value), config, exemplar.judge_item_id, exemplar.judge, returnedModel); }
  catch { failed = true; }
  if (!failed) throw new Error(`Negative regression unexpectedly passed: ${label}`);
  return label;
};

const syntheticPasses = [
  expectPass(parsedExemplar, "canonical"),
  expectPass(Object.fromEntries(Object.entries(parsedExemplar).filter(([key]) => !["judge_config_id", "rubric_version"].includes(key))), "observed omitted config/rubric"),
  (() => { parseJudgeJson("```json\n" + JSON.stringify(parsedExemplar) + "\n```", config, exemplar.judge_item_id, exemplar.judge, exactModel); return "fenced JSON"; })()
];
const syntheticRejections = [
  expectFail({ ...parsedExemplar, judge_config_id: "WRONG" }, "wrong config"),
  expectFail({ ...parsedExemplar, rubric_version: "WRONG" }, "wrong rubric"),
  expectFail({ ...parsedExemplar, judge_item_id: "WRONG" }, "wrong item"),
  expectFail(parsedExemplar, "wrong model", "WRONG"),
  expectFail({ ...parsedExemplar, criteria: { ...(parsedExemplar.criteria as Record<string, unknown>), S4: undefined } }, "missing S4")
];

const isolated = await mapConcurrentSettled(
  [1, 2, 3],
  2,
  async (value) => { if (value === 2) throw new Error("fixture failure"); return value; },
  (value) => value
);
if (isolated.results.length !== 2 || isolated.failures.length !== 1) throw new Error("Batch failure isolation regression failed.");

const failure = classifyExistingJudgeFailure("P01F_C01_BL_KIMI3_R02", "judgeB", outputRoot, new Error("Judge truncation/token exhaustion: P01F_C01_BL_KIMI3_R02_judgeB"));
if (!failure.paidRawExists || failure.classification !== "TRUNCATION_TOKEN_EXHAUSTION" || failure.retryable) throw new Error(`Unexpected failed-cell classification: ${JSON.stringify(failure)}`);
preserveFailure(failure, outputRoot);

const reportPath = resolveProjectPath("outputs/validation/P01/P01_FINAL_JUDGE_PRODUCTION_REGRESSION.json");
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify({
  schema_version: "P01_FINAL_JUDGE_PRODUCTION_REGRESSION_V1.0",
  historical_raws_inspected: records.length,
  historically_recoverable: recoverable,
  historically_parsed: parsed,
  pass_rate: recoverable ? parsed / recoverable : 0,
  synthetic_passes: syntheticPasses,
  synthetic_rejections: syntheticRejections,
  batch_isolation: { results: isolated.results.length, failures: isolated.failures.length, pass: true },
  failed_cell: failure,
  observed
}, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify({ status: "PASS", report_path: reportPath, historical: `${parsed}/${recoverable}`, failed_cell_class: failure.classification, batch_isolation: "PASS" })}\n`);
