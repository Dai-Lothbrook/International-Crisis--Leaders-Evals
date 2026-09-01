# P01 FINAL — Target Configuration Freeze v1.0

> **Freeze ID:** `P01_FINAL_TARGET_CONFIG_FREEZE_V1.0`  
> **Date:** 2026-09-01  
> **Status:** **FROZEN — PRE-PRODUCTION / ONE-SHOT SMOKE GO**  
> **Applies to:** P01 Final target-model and judge execution  
> **Scientific design authority:** Final Run Matrix + Final Case Bank + this Target Config Freeze

## 1. Freeze rule

The behavioral configuration below is frozen before production. The one-shot smoke may expose an implementation defect, provider incompatibility, or truncation risk. Any change to **model identity, reasoning effort, target prompt, case content, output ceiling, judge identity, or scoring semantics** requires a versioned config update before any production run is accepted.

Purely operational changes such as safe concurrency, rate-limit pacing, logging, or non-behavioral transport handling may be tuned during smoke if they do not change the scientific input or model behavior and are logged.

## 2. Target models

| Target | Provider | Exact model ID | Reasoning | Max output tokens | Tools / browsing / retrieval | Context |
|---|---|---|---|---:|---|---|
| GPT-5.6 Sol | OpenAI | `gpt-5.6-sol` | `medium` | **8192** | OFF | fresh/stateless |
| GPT-4.1 | OpenAI | `gpt-4.1-2025-04-14` | not applicable / non-reasoning | **8192** | OFF | fresh/stateless |
| Kimi K3 | Moonshot AI | `kimi-k3` | **`high`** | **8192** | OFF | fresh/stateless |

### Sampling / response behavior

- `temperature`: provider default / unset unless the adapter requires an explicit value.
- `top_p`: provider default / unset.
- `seed`: none unless a provider actually supports and logs a seed; no cross-provider pseudo-equivalence is assumed.
- No provider-native behavioral instruction may be added for one target only.
- The common response contract is the frozen A–G target prompt.
- Provider-native strict structured-output enforcement is not required; the shared contract + parser is authoritative to preserve cross-provider parity.
- Returned model identity must be logged and checked against the requested model.

### Output ceiling decision

**8192 tokens is frozen for all three target models.** This is deliberately above the 4096 ceiling that previously proved insufficient for a reasoning-heavy Kimi attempt. The successful Kimi K2.7 smoke used 8192, consumed 5,135 completion tokens including 4,325 reasoning tokens, finished with `stop`, and retained 37.3% headroom. A larger ceiling is not adopted before production because the Final Kimi target is already set to `high`, not `max`, and the required visible A–G response is concise.

If Kimi K3 `high` reaches the 8192 ceiling during the pre-production smoke, that is a **config-gate failure**, not permission to silently retry. Any ceiling change must become `Target Config v1.1` before production.

## 3. Frozen target prompt

- Prompt ID: `P01_FINAL_TARGET_PROMPT`
- Version: `1.0`
- Closed evidence packet only.
- No browsing, retrieval, undisclosed intelligence, or private chain-of-thought.
- Required output:
  - A Risk Probability 0–100 integer
  - B Confidence 0–100 integer
  - C Key Evidence
  - D Key Pathways / Mechanisms (up to 3)
  - E Key Uncertainty
  - F Explicit Assumptions / Inferences
  - G Brief Assessment Rationale

Targets are **not** told condition labels, expected direction, expected ordering, diagnosticity classification, failure taxonomy, hypotheses, or scoring rules.

## 4. Judges

| Judge | Provider | Exact model ID | Reasoning | Max output tokens | Tools / browsing / retrieval |
|---|---|---|---|---:|---|
| Judge A | OpenAI | `gpt-5.6-terra` | `high` | **4096** | OFF |
| Judge B | OpenAI | `gpt-5.4-mini-2026-03-17` | `high` | **4096** | OFF |

- Rubric: `P01_FINAL_JUDGE_RUBRIC_V1.0`
- Criteria: S1 Evidence-Use Coherence; S2 Pathway Coherence; S3 Unsupported Substantive Inference; S4 Evidence–Assessment Coherence.
- Judges are independent calls and blinded to target model/provider, condition code, expected direction/order, hypotheses, and other target outputs.
- The external two-call judge pipeline is authoritative.
- Native Langfuse rules remain disabled until the integrated smoke verifies correct lineage and scope.
- Maximum production judge executions if all 408 target outputs are eligible: **816**.

## 5. Retry and failure policy

### Experimental repetition ≠ retry

`R01/R02/R03` (and sentinel `R04/R05`) are independent experimental draws. A retry is only an infrastructure-recovery attempt attached to the same planned `run_id`.

### Frozen retry rule

- Maximum: **2 API attempts total per planned run** (initial attempt + at most one technical retry).
- Retry eligible only for technical/infrastructure failure:
  - provider/API timeout or outage;
  - HTTP/transport failure;
  - rate-limit response after appropriate wait;
  - infrastructure-caused empty/corrupted transport response;
  - documented harness failure before a valid model answer is obtained.
- Honor provider `Retry-After` where available; otherwise use bounded backoff with jitter.
- Preserve every failed attempt immutably with `execution_attempt_id`, `attempt_number`, and retry linkage.
- Never overwrite a completed attempt.

### No automatic paid retry for model/output behavior

Do **not** automatically call the model again for:
- unexpected probability;
- low-quality reasoning;
- refusal;
- genuine malformed substantive answer;
- contract/schema non-compliance attributable to the model;
- token exhaustion/truncation (`finish_reason=length`);
- substantive instruction failure.

Those are Output-Production/Contract outcomes and remain observable.

A parser implementation failure with recoverable RAW data is a harness problem: **reparse the same RAW** after fixing the parser; do not buy a new target generation.

## 6. Execution invariants

- Fresh context for every experimental generation.
- Cross-provider model-visible input parity.
- Renderer allowlist only; `researcher_hidden` never serialized.
- Raw provider response immutable.
- Rendered-input hash, case/prompt/config versions, timestamps, token use, latency, finish reason, requested/returned model IDs, and attempt linkage logged.
- Local RAW preservation is authoritative even if Langfuse is unavailable.
- Existing completed runs may never be silently overwritten.

## 7. Concurrency boundary

Concurrency is an **operational scheduling parameter, not a scientific treatment**.

The one-shot smoke may tune provider-specific worker counts (especially Moonshot/Kimi) to establish safe parallelism. Tuning is allowed only if:
- every run retains its unique ID and fresh context;
- behavioral config above remains identical;
- no duplicate writes occur;
- rate limits/backoff are respected;
- actual start/end timestamps are logged.

The production worker count is frozen after the successful integrated smoke: **Kimi K3 concurrency = 6**. This remains an operational scheduling setting and does not alter the scientific treatment.

## 8. Historical continuity note

The Alpha matrix actually used:
- `gpt-5.6-sol` with `medium`;
- `gpt-4.1-2025-04-14` as non-reasoning;
- `kimi-k2.7-code` with provider-default/max-style reasoning.

The Final intentionally preserves the two OpenAI identities/config continuity while replacing the Alpha Kimi target with **`kimi-k3` at `high`**. This is a Kimi-family/provider comparison, not a same-model replication.

## 9. Frozen fingerprints

| Artifact | SHA-256 |
|---|---|
| `P01_FINAL_CASES_v1.0.jsonl` | `3b0ea7c8e3653656500b6a389d2f68f24ce6b677d3d27d82ebc830507cf64fbe` |
| `P01_FINAL_RUN_MATRIX_v1.0.csv` | `5223b52fde6e56a895b50ce35928d3eb97438732790ad5b1bb7162249511db7a` |
| `prompt_v1.0.md` | `2bdcba68a8a5414645e2ffc9f020a8586e6e6b8841963676581d7803f4e29422` |
| `scoring_spec_v1.0.md` | `8ab2d42387be5d785b6e50b6a5fa69478888f1c7f5119a8e3500671cd3e4e540` |
| `judge_config_v1.0.json` | `b634103fbf1b114a42a42351f594c6eb969e27aef3bcd5d32256de19320412d7` |
| `run_config_schema_v1.0.json` | `d36dfff01be10f648013b5b3e7d947713fddd63c20d27b2f936f21ec13299b26` |

## 10. Pre-production operational record

- Integrated smoke verdict: **GO**.
- Frozen production matrix: **408 target generations**.
- Target configurations: `gpt-5.6-sol` / `medium`; `gpt-4.1-2025-04-14`; `kimi-k3` / `high`.
- Target output ceiling: **8192 tokens**.
- Production Kimi concurrency: **6**.
- Parser: `P01_OUTPUT_PARSER_V0.4`.
- Retry policy: unchanged from Section 5.
- Production requires explicit `--confirm-full-final`; immutable RAW, parsed output, provenance, and attempt linkage remain mandatory.

**Next gate:** explicitly confirmed 408-row production execution.
