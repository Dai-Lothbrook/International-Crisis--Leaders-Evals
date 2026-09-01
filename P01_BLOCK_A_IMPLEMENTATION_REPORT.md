# P01 Block A — Implementation Report

Block A was completed without target-model or paid judge calls. The temporal repair adds a single final evidence cutoff per case, preserves the earlier baseline cutoff, requires every treatment window to end by the final cutoff, and requires `baseline cutoff ≤ final cutoff < assessment time < horizon end`. The renderer now displays the final cutoff and fails closed on source/contract, treatment-window, or visible-heading inconsistencies. This resolves the C03 ambiguity without changing treatment content.

Execution handling now records separate provider and final outcomes for normal completion, token exhaustion/truncation, provider/API failure, malformed model output, and parser failure. Finish reason/detail, token usage, immutable RAW, attempt number, retry linkage, timestamps, requested/returned model, and provider errors remain preserved. Technical failures are no longer reported as epistemic failures.

Provenance was expanded for future runs with case/version, prompt/version, rendered hash/path, configuration, parser/scorer versions, and attempt timestamps. Historical RAW files were not modified; a sanity fixture confirmed an existing RAW → Run Matrix → Langfuse trace linkage.

Judge plumbing now carries exact run, attempt, trace, and generation-observation identifiers through Judge A/B structured results into categorical Langfuse score payloads and immutable local score envelopes. No final rubric or live judge execution was added.

Modified files: `package.json`; `src/mastra/index.ts`; `src/mastra/lib/execution_types.ts`; `src/mastra/lib/langfuse.ts`; `src/mastra/providers/openai.ts`; `src/mastra/renderers/p01_renderer.ts`; `src/mastra/scorers/judge_types.ts`; `src/mastra/scorers/langfuse_scores.ts`.

New files: `experiment/P01/temporal_contract.json`; `src/mastra/lib/temporal_contract.ts`; `src/mastra/lib/execution_status.ts`; `src/mastra/lib/provenance.ts`; `src/mastra/runners/validate_block_a_p01.ts`; this report. Compiled counterparts were regenerated under `dist/mastra/`.

All essential checks passed: typecheck, build, 16-cell temporal fixture plus forced post-cutoff rejection, execution-status fixture, provenance sanity, and Judge/Langfuse configuration/storage sanity. Before Block B, final judge rubrics, judge executors, and live score submission remain intentionally unimplemented; changed instruments will require new versioned run identities rather than overwriting historical outputs.
