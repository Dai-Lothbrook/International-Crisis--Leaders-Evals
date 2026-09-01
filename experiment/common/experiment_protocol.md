# Experiment Protocol

**Project:** Strategic AI Evaluation — Alpha Probes  
**Document:** Experiment Protocol  
**Version:** v0.3  
**Status:** FROZEN FOR ALPHA

---

## 1. Purpose

This document defines the common execution protocol for the Alpha Probes.

COMMON infrastructure governs shared execution, isolation, provenance, storage, and reproducibility.

Probe-specific construct logic, treatment logic, prompts, failure indicators, and scoring rules remain isolated within the active Probe.

The Alpha is a small diagnostic experiment. It is not a population-level benchmark, a deployment-safety certification, or an estimate of general strategic competence.

---

## 2. Shared Case Portfolio

The Alpha currently uses four shared synthetic case worlds:

- `ALPHA_SHARED_CASE_01` — Diagnostic-up responsiveness
- `ALPHA_SHARED_CASE_02` — Diagnostic-down responsiveness
- `ALPHA_SHARED_CASE_03` — Salience / invariance stress
- `ALPHA_SHARED_CASE_04` — Conflicting / dependent evidence robustness

Each shared case may contain researcher-side support metadata for multiple probes.

This does NOT imply that all probe-specific information is loaded, exposed, or used during every run.

---

## 3. Active-Probe Isolation

Every run MUST declare exactly one:

`active_probe`

Allowed Alpha values:

- `P01`
- `P02`

### If `active_probe = P01`

Load only:

- shared case core;
- P01-visible materials;
- P01 prompt;
- P01 output requirements;
- P01 scoring configuration.

Do not load into the target-model input, active scorer, or active judge:

- `probe_02_support`;
- P02 missing-information labels;
- P02 expected high-value requests;
- P02 failure indicators;
- P02 scoring logic.

### If `active_probe = P02`

Load only:

- shared case core;
- P02-visible materials;
- P02 prompt/delta;
- P02 output requirements;
- P02 scoring configuration.

Do not load into the target-model input, active scorer, or active judge:

- `probe_01_support`;
- P01 expected directions;
- P01 diagnosticity labels;
- P01 treatment hypotheses;
- P01 failure indicators;
- P01 scoring logic.

Cross-probe leakage constitutes a protocol failure.

---

## 4. Experimental Unit

The fundamental execution unit is:

> one shared case × one active probe × one probe-specific condition × one target model × one independent repetition.

Each unit produces one immutable raw target-model output.

Every execution unit MUST have a unique Run ID and a corresponding Run Manifest entry.

---

## 5. Shared World vs Probe Extension

Each case contains two logically separate layers:

### Shared World

Probe-neutral scenario facts, actors, timeline, baseline situation, and common contextual information.

### Active Probe Extension

Information or structure required only for the active experimental construct.

The Run Harness MUST assemble the final model-facing input from:

> Shared World + Active Probe Extension

and never from:

> Shared World + All Probe Extensions.

Researcher-only hidden metadata is never part of the target-model input.

---

## 6. Closed Evidence Environment

Unless explicitly changed by a probe protocol, target models operate inside a closed evidence environment.

No:

- web search;
- external retrieval;
- persistent memory;
- previous run context;
- previous treatment information;
- inactive-probe information.

Claims extending beyond supplied evidence must be identified as inference or assumption where required by the active probe.

---

## 7. Fresh Context

Every independent run begins from a fresh context or isolated session.

The model must not receive:

- previous conditions;
- previous repetitions;
- another model's output;
- hidden case specifications;
- diagnosticity rationales;
- expected treatment direction;
- experimental hypotheses;
- information belonging to another probe.

If a provider cannot guarantee context isolation, this must be logged as a configuration limitation.

---

## 8. Pre-Run Freeze

Before executing any target-model run, freeze the artifacts relevant to that run.

### Common

- shared case version;
- model configuration;
- common execution protocol;
- shared output envelope;
- Run Harness version.

### Probe-specific

- active probe;
- visible probe extension;
- prompt;
- condition;
- hidden probe specification;
- primary scoring logic;
- semantic rubric where applicable.

Researcher-side rationales relevant to the active Probe must be written before target outputs are inspected.

No artifact may be silently changed after execution begins.

---

## 9. Run Manifest Requirement

Each run MUST record at minimum:

- Run ID;
- timestamp;
- shared case ID/version;
- active probe;
- condition;
- target model alias and exact config version;
- prompt version;
- output schema version;
- harness version;
- repetition code;
- tool permissions;
- runtime settings;
- execution status;
- retry status, if any.

The Run Manifest is the authoritative linkage between a raw output and the frozen configuration that produced it.

---

## 10. Independent Repetitions

A repetition uses the same:

- shared case;
- active probe;
- condition;
- prompt;
- model configuration;
- output schema;
- harness logic.

Only stochastic model behavior or uncontrollable provider-side nondeterminism should differ.

No repetition inherits another repetition's context.

---

## 11. Run Ordering and Randomization

Where technically feasible, execution order should avoid systematically grouping all runs by condition in a way that could confound time, provider drift, or infrastructure state with treatment.

For Alpha scale, a simple randomized or interleaved run order is sufficient.

The chosen order rule MUST be fixed before execution and recorded in the Run Matrix.

If operational constraints require a non-random order, document the reason.

---

## 12. Probe-Specific Treatment Logic

COMMON does not define the scientific treatment effect.

Treatment logic belongs to the active Probe.

For example:

- P01 may manipulate evidentiary diagnosticity.
- P02 may manipulate unresolved information and opportunities for information seeking.

The Common Harness guarantees correct delivery, isolation, logging, and routing.

---

## 13. Raw Output Preservation

Raw target-model outputs are immutable.

Derived artifacts such as:

- parsed outputs;
- deterministic scores;
- judge outputs;
- adjudications;
- analysis tables;

must be stored separately and versioned where appropriate.

No parser, normalizer, or scorer may overwrite the raw response.

---

## 14. Deterministic Scoring Boundary

COMMON provides infrastructure for deterministic scoring.

The definition of each metric belongs to the active Probe.

The harness must not apply P01 metrics to P02 outputs or vice versa.

Parsing failure and substantive model failure must remain distinct.

---

## 15. Semantic Judge Boundary

Semantic judges receive only:

- information required by the active Probe;
- relevant visible evidence;
- candidate output;
- frozen active-probe rubric.

Primary judges should not receive:

- target-model identity where avoidable;
- treatment labels;
- expected direction;
- experimental hypothesis;
- inactive-probe metadata.

Judge outputs are stored separately from deterministic scores.

---

## 16. Human Audit

Human audit validates the measurement process rather than supplying a universal strategic “gold answer.”

Sampling may prioritize:

- judge disagreement;
- severe failure labels;
- scoring anomalies;
- selected judge agreements;
- unexpected model behavior.

Probe-specific audit criteria may differ.

---

## 17. Technical Failure and Retry Policy

Technical errors and substantive model failures must remain distinct.

A retry is permitted only for documented infrastructure or delivery failures, such as:

- API/network failure;
- empty response caused by transport failure;
- malformed delivery caused by harness error;
- provider-side timeout;
- schema transport failure that prevented the task from being presented as intended.

A valid but poor, incomplete, refusal-like, or substantively incorrect model response must not be rerun merely because it is undesirable.

Every retry MUST:

1. preserve the failed raw artifact where available;
2. receive a new Run ID or retry suffix;
3. record the failure reason;
4. use the same frozen configuration unless the run is explicitly reclassified as a new configuration.

---

## 18. Cross-Probe Contamination Failure

A run is invalid if inactive-probe information was exposed to:

- the target model;
- the active scorer;
- the active judge;

when that information could affect behavior or evaluation.

Affected runs must be flagged.

Depending on severity, they must be:

- excluded; or
- rerun under a corrected frozen configuration.

The contamination event must also be recorded in the Design Decision Log.

---

## 19. Protocol Deviations

Any deviation from the frozen protocol during execution must be recorded before interpretation.

Examples include:

- changed model endpoint;
- altered prompt;
- changed output schema;
- changed run order;
- changed tool availability;
- modified scorer or judge rubric;
- unexpected provider behavior.

A deviation must not be silently normalized away.

---

## 20. Alpha Interpretation Boundary

Results support claims about conditional behavior inside the specified experimental instrument.

They do not automatically support claims about:

- general strategic competence;
- all geopolitical crises;
- deployment safety;
- autonomous strategic decision-making;
- real-world outcomes.

Cross-model comparisons are interpreted as comparisons between configured systems under matched conditions, not as pure architecture effects.

---

## 21. Completion Criterion

A Probe Alpha is operationally complete when:

1. active-probe artifacts are frozen;
2. the Run Matrix and run-order rule are frozen;
3. planned runs are executed or deviations logged;
4. raw outputs are preserved;
5. deterministic scoring is complete;
6. necessary semantic judging is complete;
7. important anomalies are inspected;
8. protocol deviations and contamination events are resolved or documented;
9. the probe can be assessed for signal, interpretability, scorability, construct clarity, relevance, and scalability.
