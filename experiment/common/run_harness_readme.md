# Run Harness — Alpha Probe 01

**Project:** Strategic AI Evaluation — Alpha Probes  
**Component:** Run Harness  
**Version:** v0.3-controller-kimi-patched  
**Status:** PRE-SMOKE-TEST — NOT YET FROZEN

---

## 1. Purpose

The Run Harness is the execution layer that converts the Controller-approved Run Matrix into reproducible target-model calls.

It does **not** define the scientific construct, treatment logic, case diagnosticity, expected direction, or scoring criteria.

Its responsibility is to ensure that every planned run receives exactly the correct:

- active probe;
- case package and version;
- treatment condition;
- target model and provider;
- model configuration;
- repetition;
- target prompt;
- response contract / output schema.

The Harness must preserve:

- active-probe isolation;
- fresh-context execution;
- renderer allowlisting;
- cross-provider input parity;
- provenance;
- raw-output immutability;
- reproducible run order;
- technical-error logging;
- resumability without silent overwrites.

---

## 2. Authoritative Inputs

The authoritative execution manifest is:

`07_Run_Matrix_Alpha.csv`

For Probe 01 Alpha, the current matrix contains:

- 96 planned runs;
- 4 cases;
- 4 P01 conditions per case: `BL`, `SD`, `WD`, `ND`;
- 3 configured target-model systems;
- 2 independent repetitions per case × condition × model cell.

Every matrix row corresponds to **one intended experimental run**.

The Run Matrix is a manifest, not the model-visible case payload. The Harness must resolve the referenced case package, prompt, schema, and configuration before rendering the final target-model input.

The case packages are expected at paths such as:

- `experiment/cases/C01.jsonl`
- `experiment/cases/C02.jsonl`
- `experiment/cases/C03.jsonl`
- `experiment/cases/C04.jsonl`

---

## 3. Required Run-Matrix Fields

The Harness must read at minimum:

- `run_id`
- `run_order`
- `active_probe`
- `package_id`
- `case_id`
- `case_version`
- `base_world_id`
- `variant_id`
- `condition_code`
- `condition_version`
- `event_id`
- `model_provider`
- `model_id`
- `reasoning_setting`
- `model_config_version`
- `repetition`
- `prompt_id`
- `prompt_version`
- `output_schema_id`
- `output_schema_version`
- `hidden_spec_id`
- `hidden_spec_version`
- `case_source_path`
- `model_input_policy`
- `raw_output_path`
- `parsed_output_path`

Before execution, the Harness must fail closed if a required reference cannot be resolved or if a referenced case, prompt, schema, or configuration version does not match the planned row.

Researcher-only fields may be used only for researcher-side validation and variant lookup. They must never be serialized into target-model input.

---

## 4. Model Configurations

The Alpha currently uses these configured model systems:

### GPT-5.6 Sol
- Provider: OpenAI
- Model ID: `gpt-5.6-sol`
- Reasoning setting: `medium`

### GPT-4.1
- Provider: OpenAI
- Model ID: `gpt-4.1-2025-04-14`
- Reasoning setting: not applicable / non-reasoning

### Kimi K2.7 Code
- Provider: Moonshot AI
- Model ID: `kimi-k2.7-code`
- Reasoning setting: provider default as recorded in the Run Matrix

Provider-specific parameters that could affect output must be explicit in the model-config artifact or logged at execution time. At minimum log, where applicable:

- model identifier returned by provider;
- reasoning setting;
- temperature;
- top-p;
- maximum output tokens;
- response-format mode;
- tool availability;
- provider-specific seed if actually supported and used.

Do not silently use different behavioral settings across repetitions.

---

## 5. Execution Pipeline

For each Run Matrix row:

1. Read run metadata.
2. Verify `active_probe = P01`.
3. Resolve and validate the referenced case package.
4. Verify package/case version and identifiers.
5. Select the shared model-visible baseline.
6. Select only the specified P01-visible treatment variant.
7. Exclude all P02 and researcher-only metadata.
8. Resolve the P01 target prompt.
9. Resolve the response contract / output schema.
10. Resolve the specified model configuration.
11. Render the complete target-model input using an allowlist.
12. Compute and store a deterministic hash of the rendered input.
13. Open a fresh stateless model context.
14. Execute exactly one target-model call.
15. Capture the complete provider response and execution metadata.
16. Store the raw output immutably.
17. Parse the response against the frozen response contract.
18. Store parsed output separately.
19. Record trace/log metadata.
20. Mark execution status.

The Harness must not change the scientific content while rendering.

---

## 6. Active-Probe Isolation

Current matrix requirement:

`active_probe = P01`

For every P01 run:

### ALLOW

- shared model-visible world;
- the selected P01-visible variant;
- P01 target prompt;
- P01 response contract / output schema.

### NEVER EXPOSE

- P02 support metadata;
- P02 missing-information structure;
- P02 expected or high-value requests;
- hidden diagnosticity;
- expected direction;
- researcher rationale;
- source-dependence labels unless explicitly part of visible case evidence;
- experimental hypothesis;
- scoring rules;
- judge instructions.

Cross-probe or hidden-field leakage invalidates the affected run.

---

## 7. Renderer Policy

The Harness must obey:

`renderer_allowlist_only`

Never serialize an entire JSONL record or package directly into a target-model request.

The renderer must explicitly select approved model-visible fields and assemble them in a stable order.

The final rendered input should contain only:

1. the approved model-visible case/event material;
2. the approved baseline evidence packet;
3. the selected treatment update, if the condition is not `BL`;
4. the frozen P01 target instructions.

The spreadsheet / Run Matrix row itself is **not** the model prompt.

Before full execution, save rendered-input previews for manual inspection during the smoke-test gate.

---

## 8. Cross-Provider Parity

The scientific input must be materially identical across providers.

Provider adapters may make only the minimum transport-level changes needed by an API.

Do not:

- add provider-specific substantive instructions;
- expose extra context to one model;
- enable browsing/tools for one provider but not others;
- use provider-specific hidden system content that changes the task;
- enforce a response mode for one provider that materially changes the task unless the same behavioral contract is preserved across all providers.

Any unavoidable provider-specific adaptation must be documented in the model config and execution log.

---

## 9. Fresh-Context Rule

Every run must start from an independent context.

No run may inherit:

- previous case output;
- previous condition;
- previous repetition;
- previous target-model interaction;
- judge output;
- hidden metadata;
- prior conversation state.

Each repetition is a genuinely independent call under the same frozen configuration.

---

## 10. Run Order and Randomization

Execute planned runs according to `run_order`.

The current Run Matrix uses a reproducible seeded constrained randomization:

- seed: `20260830`;
- interleaving is fixed in the matrix.

The Harness should preserve this logical execution order.

If provider rate limits require waiting, **wait rather than silently reordering runs**.

Any unavoidable deviation from planned order must be logged with:

- affected run IDs;
- reason;
- actual execution order/timestamps.

---

## 11. Repetitions

`R01` and `R02` represent independent executions of the same frozen:

> model × case × condition configuration.

The Harness must not intentionally vary any experimental parameter between repetitions.

Repetition is not a retry.

A retry is an infrastructure-recovery attempt attached to a failed execution attempt.

---

## 12. Execution Attempts and Retry Policy

The experimental `run_id` identifies the planned experimental unit and must remain stable.

Infrastructure attempts should use a separate identifier such as:

`execution_attempt_id`

Recommended logic:

- `run_id` = planned experimental unit;
- `execution_attempt_id` = concrete API attempt;
- `attempt_number` = 1, 2, ...;
- `retry_of_attempt_id` = previous failed infrastructure attempt, when applicable.

Do **not** create an additional experimental run merely because an infrastructure retry occurred.

A retry is eligible only for a technical failure.

### Technical failures include

- API timeout;
- provider outage;
- HTTP/transport failure;
- empty response caused by infrastructure failure;
- corrupted transport response;
- documented Harness failure.

### Not automatically retry-eligible

- low-quality reasoning;
- unexpected probability;
- substantive instruction failure;
- a valid but malformed model answer;
- schema non-compliance that reflects model behavior rather than transport failure.

Preserve every failed attempt and its metadata.

---

## 13. Raw Output and Request Policy

Raw provider responses are immutable.

Write the successful experimental response to the exact planned `raw_output_path` without silently cleaning or normalizing it.

Also preserve enough request-side provenance to reconstruct the call, including:

- `run_id`;
- rendered-input hash;
- prompt version;
- case/package version;
- model config version;
- provider/model ID;
- execution timestamp.

Secrets must never be stored in raw output files, logs, traces, CSVs, Markdown files, or Git.

API keys belong in environment variables / `.env` excluded from version control.

---

## 14. Schema Validation

After execution:

- validate required structured fields;
- preserve schema violations when they are model behavior;
- distinguish model-output failure from parser/infrastructure failure;
- do not silently repair substantive target-model output.

For cross-provider comparability, the output schema is primarily a common **response contract and parser target**. Provider-native structured-output enforcement should be used only if it preserves equivalent behavior across all target models.

---

## 15. Execution Statuses

Recommended run-level statuses:

- `PLANNED`
- `RUNNING`
- `SUCCEEDED`
- `TECHNICAL_FAILED`
- `MODEL_OUTPUT_INVALID`
- `PARSER_FAILED`
- `INVALIDATED_LEAKAGE`
- `SKIPPED_ALREADY_COMPLETE`

Attempt-level statuses should be logged separately.

A valid but poor substantive answer can still be `SUCCEEDED`.

---

## 16. Idempotency and Resume Behavior

The Harness must support safe restart.

Before executing a planned row:

1. check whether the planned raw-output path already exists;
2. check run ID and rendered-input hash;
3. if a matching completed run exists, do not overwrite it;
4. if files exist but provenance/hash conflicts, stop and require explicit human resolution.

Never silently overwrite a completed Alpha run.

---

## 17. Smoke-Test Gate

Before executing all 96 runs:

### A. Dry-render inspection — no API calls required

Render and manually inspect all four C01 P01 conditions:

- `C01-BL`
- `C01-SD`
- `C01-WD`
- `C01-ND`

Verify:

- correct baseline;
- correct treatment exposure;
- no hidden fields;
- no P02 metadata;
- stable prompt;
- stable schema instructions.

### B. Provider smoke calls

Execute:

- C01-BL × GPT-5.6 Sol × R01;
- C01-BL × GPT-4.1 × R01;
- C01-BL × Kimi K3 × R01.

Verify:

- provider routing;
- model config;
- output capture;
- parsing;
- local raw/parsed storage;
- Langfuse tracing;
- fresh contexts;
- input hash/provenance;
- no secret leakage.

### C. Mini-pilot

After the smoke test, execute:

> C01 × BL/SD/WD/ND × 3 models × 2 repetitions = 24 planned runs.

Only after the smoke gate and any necessary Controller patch should:

`harness_version = FROZEN_ALPHA_VERSION`

replace the current pending value.

If the target prompt changes substantively after smoke testing, update its version and regenerate or patch the Run Matrix references before the full Alpha.

---

## 18. Logging and Langfuse Observability

For each execution attempt record at minimum:

- run ID;
- execution attempt ID;
- logical run order;
- actual start/completion time;
- provider response status / HTTP status when available;
- request/provider ID when available;
- model identifier returned by provider;
- reasoning/config settings;
- prompt/version;
- case/package/version;
- condition;
- repetition;
- rendered-input hash;
- raw-output location;
- parsed-output location;
- parsing status;
- token usage when returned;
- latency;
- finish/stop reason when returned;
- technical error;
- retry linkage.

When Langfuse is enabled, attach at least:

- `run_id`;
- `case_id`;
- `condition_code`;
- `model_id`;
- `repetition`;
- prompt version;
- case version;
- harness version.

Local raw-output preservation remains authoritative even if Langfuse tracing fails. A Langfuse outage alone must not destroy or overwrite an otherwise valid target-model response.

---

## 19. Harness Boundary

The Harness executes the experiment.

It must **not**:

- change diagnosticity labels;
- infer expected direction;
- alter case content;
- modify scoring logic;
- select preferred model outputs;
- rerun valid poor responses;
- expose hidden researcher information;
- judge model quality during target execution.

---

## 20. Freeze Rule

The Harness can be frozen for Alpha only after:

1. dry-render inspection passes;
2. all three provider smoke calls succeed or have understood provider-specific fixes;
3. raw and parsed storage is validated;
4. Langfuse tracing is validated;
5. retry and resume behavior is tested;
6. model configs are explicit;
7. the final rendered prompt/input is inspected for leakage;
8. any substantive prompt change has been versioned and propagated to the Run Matrix.

After freeze, substantive Harness changes require a new Harness version and must be logged in the Design Decision Log.
