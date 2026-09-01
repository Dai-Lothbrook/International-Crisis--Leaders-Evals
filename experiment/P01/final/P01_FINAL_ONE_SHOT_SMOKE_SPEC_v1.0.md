# P01 FINAL — One-Shot Fast Smoke Specification v1.0

> **Smoke ID:** `P01_FINAL_ONE_SHOT_SMOKE_V1.0`  
> **Status:** PRE-PRODUCTION OPERATIONAL GATE  
> **Scientific design:** already frozen; this smoke MUST NOT redesign cases, treatments, scoring, target identities, or repetitions.

## Purpose

Run one compact end-to-end operational test before the 408-generation production campaign.

The smoke tests, in one command:

1. Final Run Matrix / case-bank loading and rendering;
2. all three target providers/models;
3. **six Kimi K3 requests concurrently**;
4. special Final conditions (Authority + contradiction + sentinels);
5. immutable RAW / parsed output / provenance;
6. Langfuse smoke traces;
7. Judge A + Judge B end-to-end on two selected smoke outputs;
8. whether Kimi concurrency materially reduces wall-clock time without corrupting run identity, output storage, or telemetry.

This smoke is **not** part of the scientific sample and its outputs MUST NOT satisfy or overwrite production Run Matrix rows.

---

## 1. Authoritative inputs

- `experiment/cases/P01_FINAL_CASES_v1.0.jsonl`
- `experiment/runs/P01_FINAL_RUN_MATRIX_v1.0.csv`
- `experiment/P01/final/P01_FINAL_TARGET_CONFIG_FREEZE_v1.0.md`
- `experiment/P01/final/P01_FINAL_DESIGN_FREEZE_v1.0.md`
- `experiment/P01/final/prompt_v1.0.md`
- `experiment/P01/final/judge_config_v1.0.json`
- `P01_FINAL_SMOKE_MANIFEST_v1.0.csv`

The Final Matrix contains 408 target generations. The smoke clones exactly eight frozen Final cells into a separate smoke namespace.

---

## 2. Exact target calls — 8 total

### OpenAI plumbing — 2 calls

- `C01-BL × gpt-5.6-sol × R01 source cell`
- `C01-BL × gpt-4.1-2025-04-14 × R01 source cell`

These are smoke clones, not accepted production runs.

### Moonshot/Kimi concurrency — exactly 6 calls launched together

All use:

- model: `kimi-k3`
- reasoning effort: `high`
- output ceiling: `8192`
- fresh contexts
- tools/retrieval off

Cells:

1. C01-BL — simple baseline
2. C02-SD_AUTH — Authority
3. C06-SD — temporal relevance
4. C07-SD — contradiction + reliability-sentinel structure
5. C08-SD — contradictory attribution
6. C10-SD_AUTH — Authority + pathway + reliability-sentinel structure

**Concurrency target = 6 simultaneous Kimi requests.**

Use native async scheduling / `Promise.all` or an equivalent bounded worker pool. A new dependency is not required solely for concurrency.

The two OpenAI smoke calls may run in their own provider pool at the same time. Kimi concurrency must remain capped at six.

---

## 3. Smoke namespace — mandatory

Do not consume or overwrite production runs.

Use:

- smoke run IDs beginning `P01FS_`;
- separate output paths, e.g. `outputs/smoke/P01_FINAL/...`;
- Langfuse metadata `experiment_phase=P01_FINAL_SMOKE`;
- a smoke-specific trace/run tag.

Do NOT mark corresponding `P01F_*` production rows complete.

The Final Langfuse production rules must not match smoke traces.

---

## 4. Kimi K3 configuration check

The existing Kimi adapter currently sends model/messages/max_tokens but does not demonstrate that `reasoning_effort=high` is sent.

Before any paid smoke call:

- implement the frozen K3 `high` reasoning parameter using the actual supported Moonshot/K3 API field;
- fail closed if the Final K3 call cannot be configured as `high`;
- log the requested reasoning setting in provenance;
- verify requested and returned model identity.

Do not substitute K2.7, Highspeed, `low`, or `max`.

---

## 5. Judge smoke — 4 judge executions total

Run both judges on exactly two target smoke outputs:

### Judge item A
`C01-BL × GPT-5.6 Sol`

### Judge item B
`C10-SD_AUTH × Kimi K3`

For each item:

- Judge A = `gpt-5.6-terra`, reasoning high
- Judge B = `gpt-5.4-mini-2026-03-17`, reasoning high

Expected: 4 judge executions total.

Each judge must return S1–S4 and create:

- immutable local score envelope;
- correct target run/attempt/trace/generation lineage;
- criterion-specific Langfuse scores or verified score payloads according to the frozen judge pipeline.

Judge identity, target identity, condition label, expected direction/order, and hypotheses remain blinded as specified.

---

## 6. Preflight — zero paid calls

The one command must fail closed before provider calls if any of these fail:

- TypeScript typecheck/build;
- Final Matrix count != 408;
- smoke manifest does not resolve exactly 8 source cells;
- Kimi smoke count != 6;
- Kimi model != `kimi-k3`;
- Kimi reasoning != `high`;
- target output ceiling != 8192;
- missing Final case bank/prompt/config;
- smoke output namespace collides with production namespace;
- hidden/researcher fields appear in rendered model input;
- required API/base URL environment variables are absent.

Do not print secrets.

---

## 7. What the single smoke command must measure

### Per target call

- smoke run ID + source Final run ID;
- actual start/end timestamp;
- provider/model requested and returned;
- reasoning setting requested;
- latency;
- input/output/reasoning/total tokens when available;
- finish reason;
- RAW saved;
- parser result;
- risk/confidence parsed when available;
- Langfuse trace/generation identifiers;
- technical/output status.

### Kimi concurrency block

Report:

- six launch timestamps;
- maximum observed overlapping Kimi requests;
- sum of six individual Kimi latencies;
- wall-clock duration of the six-call batch;
- `concurrency_speedup = sum(individual_latency) / batch_wall_clock`;
- provider/rate-limit errors;
- collisions/duplicate-write checks.

This is the direct test of whether concurrency solves the Alpha wall-clock bottleneck.

---

## 8. GO / PATCH / NO-GO gate

### GO

- Final preflight passes;
- all three exact target IDs route correctly;
- `kimi-k3` runs at frozen `high`;
- six Kimi calls show genuine overlap with no identifier/file collision;
- smoke outputs are isolated from production outputs;
- required RAW/provenance is preserved;
- at least the judge-selected Sol and Kimi outputs are complete and parseable;
- both judges produce S1–S4 with correct lineage;
- Langfuse smoke traces are correctly scoped;
- no hidden-field leakage;
- no unexplained model substitution.

A Kimi concurrency speedup around **3× or better** is the desired operational target. Lower speedup is not automatically scientific failure, but should trigger an operational decision before production.

### PATCH OPERATIONAL

Use when the scientific design remains intact but there is a fixable issue such as:

- concurrency scheduling;
- rate-limit pacing/backoff;
- output-path collision;
- telemetry wiring;
- parser implementation bug with recoverable RAW;
- judge score association bug.

Patch, rerun the one-shot smoke, and preserve the original smoke artifacts.

### NO-GO / CONFIG VERSION REQUIRED

Use when smoke shows that production cannot validly execute the frozen behavioral config, e.g.:

- exact K3 high cannot be requested;
- systematic 8192 truncation makes required output impossible;
- wrong model is returned;
- target prompt/case leakage requires substantive instrument change.

Do not silently alter the frozen config.

---

## 9. Required smoke outputs

The implementation should create:

- `outputs/smoke/P01_FINAL/P01_FINAL_ONE_SHOT_SMOKE_REPORT.md`
- `outputs/smoke/P01_FINAL/P01_FINAL_ONE_SHOT_SMOKE_SUMMARY.json`
- immutable RAW/parsed/provenance for all 8 target smoke calls;
- immutable local judge envelopes for the 4 judge executions.

The report ends with exactly one verdict:

`GO` / `PATCH_OPERATIONAL` / `NO_GO`

---

## 10. Production boundary

The smoke command MUST NOT execute any of the 408 production rows as accepted production data.

After a `GO`, a separate explicitly confirmed Final production command may execute the full frozen 408-row Run Matrix using reusable provider-specific concurrency infrastructure.

No scientific redesign occurs between smoke GO and production.
