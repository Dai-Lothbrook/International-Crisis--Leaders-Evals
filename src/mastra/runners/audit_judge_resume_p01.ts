import fs from "node:fs";
import path from "node:path";
import { auditFinalJudgeStorage } from "../final/judge_audit.js";
import { loadFinalMatrix } from "../final/loader.js";
import { resolveProjectPath } from "../lib/paths.js";

const outputRoot = resolveProjectPath("outputs/final/P01/judges");
const planned = loadFinalMatrix().flatMap((row) => (["judgeA", "judgeB"] as const).map((judge) => ({ itemId: `${row.run_id}_${judge}`, targetRunId: row.run_id, judge })));
const audit = auditFinalJudgeStorage(outputRoot, planned);
const counts = {
  valid_scored_unique_cells: audit.valid_scored_unique_cells.length,
  reusable_valid_unscored_raw_cells: audit.reusable_valid_unscored_raw_cells.length,
  unique_cells_requiring_new_paid_calls: audit.unique_cells_requiring_new_paid_calls.length,
  unique_terminal_nonretryable_cells: audit.unique_terminal_nonretryable_cells.length
};
const reportPath = resolveProjectPath("outputs/validation/P01/P01_FINAL_JUDGE_RESUME_AUDIT.json");
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify({ schema_version: "P01_FINAL_JUDGE_RESUME_AUDIT_V1.0", ...counts, ...audit }, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify({ ...counts, billing_quota_failure_envelopes: audit.billing_quota_failure_envelopes, langfuse_fully_complete_scored_cells: audit.langfuse_fully_complete_scored_cells, langfuse_incomplete_scored_cells: audit.langfuse_incomplete_scored_cells, report_path: reportPath })}\n`);
