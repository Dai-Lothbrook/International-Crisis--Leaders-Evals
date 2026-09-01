# Model Configuration

**Project:** Strategic AI Evaluation — Alpha Probes  
**Document:** Model Configuration  
**Version:** v0.2  
**Status:** FROZEN FOR ALPHA

---

## 1. Purpose

This document records the exact configuration of every target model used in the Alpha Probes.

Its purpose is to ensure that experimental results can be traced to the specific model, provider, access route, inference configuration, and runtime environment that produced them.

Model identity alone is not sufficient.

---

## 2. Experimental Principle

All target models should receive experimental conditions that are as comparable as technically feasible.

The experiment should distinguish:

- **controlled settings** that can be standardized across providers;
- **provider-specific settings** that cannot be standardized;
- **unknown or hidden provider behavior** that must be recorded as a limitation.

The experiment should avoid attributing to the model behavior that may instead result from:

- different system prompts;
- different tool or web access;
- different inference/reasoning settings;
- different wrappers or hosted environments;
- different context handling;
- different sampling settings;
- different output-token budgets;
- provider-side model updates.

Comparability does not require identical settings when providers expose different controls. It requires documenting those differences and avoiding unsupported causal attribution.

---

## 3. Target Model Record

Create one frozen record for each evaluated model.

### MODEL_A

**Internal ID:** MODEL_A  
**Provider:** TBD  
**Exact model name/version:** TBD  
**Access method:** TBD  
**API / direct / hosted wrapper:** TBD  
**Endpoint or platform:** TBD  
**Date accessed:** TBD  
**Run window:** TBD

### Runtime Configuration

**Temperature:** TBD / not exposed  
**Top-p:** TBD / provider default / not exposed  
**Reasoning / inference mode:** TBD / not exposed  
**Reasoning effort or budget, if exposed:** TBD  
**Max output tokens:** TBD  
**Seed, if supported:** TBD  
**Context-window limit:** TBD / provider documented  
**Streaming:** ON / OFF  
**Other sampling controls:** TBD

### Tool Configuration

**Web access:** OFF unless explicitly required by the experiment  
**External tools:** OFF unless explicitly required  
**RAG / retrieval:** OFF unless explicitly required  
**Persistent memory:** OFF  
**Previous conversation context:** NONE  
**File access:** OFF unless explicitly part of the case  
**Code execution:** OFF unless explicitly part of the task

### Prompt Configuration

**System prompt ID:** TBD  
**User prompt ID:** TBD  
**Output schema ID:** TBD  
**Prompt delivery format:** TBD  
**Structured-output / JSON mode:** TBD / not supported

### Provider / Wrapper Constraints

Record any known behavior that may affect interpretation, including:

- hidden system instructions;
- mandatory safety layers;
- automatic reasoning mode selection;
- automatic tool routing;
- provider-side prompt transformation;
- unsupported sampling controls;
- possible silent model-version updates.

**Notes:** TBD

---

### MODEL_B

Use the same record structure as MODEL_A.

---

### MODEL_C

Use the same record structure as MODEL_A.

---

## 4. Cross-Model Standardization

Where technically possible, all target models should share:

- the same visible case content;
- the same experimental condition;
- semantically identical task instructions;
- the same requested output fields;
- the same information availability;
- the same tool restrictions;
- comparable output-token budgets;
- comparable reasoning/inference settings where providers expose such controls.

If exact prompt syntax must differ because providers support different structured-output mechanisms, the semantic task content should remain unchanged and the difference must be logged.

Any unavoidable configuration difference must be documented before interpreting cross-model results.

---

## 5. Fresh-Context Requirement

Every independent experimental run should begin from a fresh context or new isolated session.

Target models must not receive:

- previous runs;
- prior experimental conditions;
- hidden case specifications;
- diagnosticity labels or rationales;
- expected experimental direction;
- experimental hypotheses;
- scores from other models;
- prior judge outputs.

If a provider cannot guarantee fresh-context isolation, record that as a limitation.

---

## 6. Repetition Rule

Repeated runs under the same model-case-condition combination must use the same frozen experimental configuration.

The only intended source of variation across repetitions is model stochasticity or provider-side nondeterminism that cannot be controlled.

Example:

```text
MODEL_A
CASE_P01_003
Condition: SD
R01 / R02 / R03
```

should otherwise use identical:

- visible case;
- prompt;
- output schema;
- tool permissions;
- runtime settings;
- access route.

If the provider changes the model or runtime configuration between repetitions, those runs should not be treated as clean repetitions without explicit qualification.

---

## 7. Inference-Budget Rule

Do not force nominally identical reasoning settings when providers expose materially different controls.

Instead:

1. choose a defensible setting for each provider;
2. keep that setting fixed across all runs of that model;
3. document the setting precisely;
4. interpret cross-model differences as differences between the **configured systems**, not as pure architecture effects.

For Alpha, consistency within each model is more important than artificial cross-provider equivalence.

---

## 8. Output-Budget Rule

Max output tokens should be high enough to avoid truncating required structured fields but not so high that one model receives a materially larger opportunity to elaborate than another.

If a response is truncated:

- preserve the raw output;
- mark the run as truncated;
- do not silently repair it;
- rerun only under a documented protocol.

---

## 9. Configuration Freeze

Before Alpha execution, the following must be frozen for each model:

- exact model/version or best available provider identifier;
- provider/access route;
- endpoint/platform;
- system prompt;
- user prompt version;
- output schema version;
- tool permissions;
- reasoning/inference setting;
- temperature/sampling configuration where controllable;
- output-token limit;
- structured-output mode where applicable.

The configuration record used for each run must be linked to the Run Matrix / run manifest.

---

## 10. Provider-Version Drift

If the provider silently changes the underlying model version, system behavior, or endpoint during the experiment:

1. record the date/time and evidence of the change if detectable;
2. mark affected runs;
3. avoid pooling pre-change and post-change runs without qualification;
4. rerun matched conditions if the change is likely to affect comparability and time permits.

Undetectable provider-side changes remain a stated limitation.

---

## 11. Wrapper Warning

If a model is accessed through a third-party host or wrapper, results should be attributed to the **configured system** when the wrapper may alter:

- system prompts;
- search behavior;
- tool access;
- context handling;
- safety policy;
- output formatting;
- sampling or reasoning settings.

Do not automatically label a hosted execution as “pure Model X” when the hosting environment materially modifies the interaction.

---

## 12. Alpha Reporting Rule

For the Alpha, report model results as:

> **Model + provider/access route + frozen configuration**

rather than treating the model name alone as the causal unit.

The Alpha is intended to compare behavior under controlled matched conditions, not to estimate provider-independent model traits.
