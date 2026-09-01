# Design Decision Log

**Project:** Strategic AI Evaluation — Alpha Probes  
**Document:** Design Decision Log  
**Version:** v0.3  
**Status:** ACTIVE

---

## 1. Purpose

The Design Decision Log records substantive changes to the shared experimental world, probe-specific extensions, execution infrastructure, scoring, judging, and interpretation.

Its central purpose is to distinguish:

- decisions made before target outputs;
- revisions caused by pilot evidence;
- changes affecting both probes;
- changes affecting only one probe;
- changes that require re-freeze, re-analysis, or reruns.

The log is append-only: accepted historical entries should not be silently rewritten.

---

## 2. Change Scope

Every substantive decision MUST identify its scope:

- `COMMON_WORLD`
- `P01_EXTENSION`
- `P02_EXTENSION`
- `RUN_HARNESS`
- `JUDGE_INFRASTRUCTURE`
- `MODEL_CONFIG`
- `OUTPUT_SCHEMA`
- `ANALYSIS`

A change must not automatically propagate across probes unless the shared world or shared infrastructure itself changed.

---

## 3. Decision Type

Each entry should identify one primary decision type:

- `DESIGN`
- `VALIDITY_FIX`
- `TECHNICAL_FIX`
- `POST_PILOT_REVISION`
- `PROTOCOL_DEVIATION`
- `CONTAMINATION_EVENT`
- `DEPRECATION`

This helps distinguish ordinary design evolution from changes triggered by observed outputs or execution failures.

---

## 4. Decision Entry Template

### `DECISION_[XXX]`

**Date:** TBD  
**Decision ID:** TBD  
**Decision Type:** TBD  
**Change Scope:** TBD  
**Active Probe:** COMMON / P01 / P02 / N/A  
**Shared Case Portfolio Version:** TBD  
**Case(s) affected:** TBD  
**Artifact(s) affected:** TBD  
**Previous version:** TBD  
**New version:** TBD  
**Effective from Run ID / date:** TBD

### Decision

TBD

### Reason

TBD

### Basis

- Literature:
- Design principle:
- Controller review:
- Pilot evidence:
- Feasibility constraint:
- Technical failure:
- Other:

### Target-model outputs already observed?

YES / NO

### Cross-Probe Impact

- None
- P01 only
- P02 only
- Both probes

### Risk of cross-probe contamination

NONE / LOW / MEDIUM / HIGH

### Requires re-freeze?

YES / NO

If YES, specify artifacts:

TBD

### Impact on previous runs

NONE / REPARSE / RESCORE / RERUN / EXCLUDE / QUALIFY / OTHER

### Required follow-up

TBD

### Status

OPEN / ACCEPTED / SUPERSEDED / REJECTED

---

## 5. Shared Case Portfolio Decisions

Changes affecting common-world properties must record whether they alter:

- actors;
- baseline ambiguity;
- timeline;
- shared facts;
- escalation target;
- time horizon;
- source structure;
- information available to both probes.

Because shared cases support multiple probes, a substantive `COMMON_WORLD` change may require review or reruns for both P01 and P02.

Changes to escalation target or time horizon are presumptively material and require explicit comparability review.

---

## 6. Probe-Specific Case Decisions

Changes to:

- `probe_01_support`

must be logged as:

`P01_EXTENSION`

Changes to:

- `probe_02_support`

must be logged as:

`P02_EXTENSION`

A P01-only change should not automatically invalidate P02 runs, and vice versa.

However, if the probe-specific change alters the model-facing shared world rather than only the extension, it must be reclassified as `COMMON_WORLD`.

---

## 7. Active-Probe Isolation Decisions

Any change affecting how the harness selects probe-specific information must be logged.

This includes:

- probe-loader behavior;
- filtering rules;
- visible/hidden field selection;
- accidental cross-probe exposure;
- scoring-routing failures;
- judge-routing failures.

Any discovered cross-probe leakage is treated as a material protocol event and should use the `CONTAMINATION_EVENT` decision type.

---

## 8. Hidden Specification Decisions

Log changes affecting:

- diagnosticity rationale;
- expected direction;
- source dependence;
- missing-information role;
- high-value/low-value information-request specification;
- anticipated confounds;
- treatment mapping;
- pathway structure.

The entry must record whether these specifications were changed before or after target outputs were observed.

Post-output changes to hidden rationales require explicit post-hoc-risk documentation.

---

## 9. Run Harness Decisions

Log infrastructure changes capable of affecting:

- model input;
- condition delivery;
- probe isolation;
- retry behavior;
- context reset;
- provider routing;
- output capture;
- run ordering;
- manifest generation.

Pure code refactoring without behavioral effects does not require a substantive decision entry.

If uncertain whether a refactor is behaviorally neutral, log it.

---

## 10. Base Case Decisions

Base-case changes must distinguish:

### Shared case change

Affects the underlying world or common facts.

### Probe-specific variant change

Affects only one experimental construct.

No executed case version may be silently overwritten.

Any revised case must receive a new artifact version.

---

## 11. Judge Infrastructure Decisions

Log changes involving:

- judge family;
- judge configuration;
- blinding;
- rubric version;
- evidence shown;
- active-probe routing;
- disagreement procedure;
- adjudication;
- judge retries or repeated scoring.

A judge must never score using inactive-probe expectations.

---

## 12. Model Configuration Decisions

Log changes involving:

- provider;
- model/version;
- access route;
- reasoning setting;
- sampling controls;
- max output tokens;
- tool permissions;
- wrapper or endpoint behavior.

Provider-side drift discovered during the Alpha should be logged even when it was not initiated by the research team.

---

## 13. Protocol Deviations and Technical Events

Any execution-time departure from the frozen protocol should be logged when it could affect interpretation.

Examples:

- wrong prompt version;
- wrong condition delivered;
- tool unexpectedly enabled;
- provider timeout requiring retry;
- schema delivery failure;
- execution under an unintended endpoint;
- non-random run order caused by operational constraints.

The entry should distinguish:

> technical execution failure

from:

> substantive model behavior.

---

## 14. Post-Pilot Revisions

Alpha iteration is permitted.

For any post-pilot change, record:

1. what observation triggered it;
2. whether the change affects COMMON or only one Probe;
3. whether previous runs remain comparable;
4. whether reruns are needed;
5. whether the change introduces post-hoc interpretation risk;
6. whether the revised artifact becomes a new Alpha version or belongs only to later development.

Do not silently pool pre-revision and post-revision runs.

---

## 15. Open Questions Register

### `OPEN_[XXX]`

**Question:** TBD  
**Scope:** COMMON / P01 / P02  
**Blocking?** YES / NO  
**Current provisional assumption:** TBD  
**Evidence needed:** TBD  
**Decision deadline:** TBD  
**Resolution Decision ID:** TBD  
**Status:** OPEN / RESOLVED / DEFERRED

Resolved open questions should point to the Decision ID that closed them.

---

## 16. Final Alpha Decision Summary

Before final Alpha interpretation, summarize:

- major COMMON decisions;
- major P01 decisions;
- major P02 decisions;
- post-pilot changes;
- protocol deviations;
- cross-probe contamination incidents;
- provider/model drift incidents;
- unresolved limitations;
- which decisions preceded versus followed target-model-output inspection.

The summary should make clear which results are directly comparable and which require qualification.

---

### `DECISION_P01_2026_08_31_KIMI_MODEL_SUBSTITUTION`

**Date:** 2026-08-31  
**Decision ID:** `DECISION_P01_2026_08_31_KIMI_MODEL_SUBSTITUTION`  
**Decision Type:** `DESIGN`  
**Change Scope:** `MODEL_CONFIG`  
**Active Probe:** P01  
**Shared Case Portfolio Version:** unchanged  
**Case(s) affected:** C01-C04 target-model cells only  
**Artifact(s) affected:** P01 Run Matrix; P01 smoke selector; Run Harness model-configuration reference  
**Previous version:** `07_Run_Matrix_Alpha_v1.0` / `kimi-k3`  
**New version:** `07_Run_Matrix_Alpha_v1.1_KIMI_K2_7_CODE` / `kimi-k2.7-code`  
**Effective from Run ID / date:** future `*_KIMI27C_*` runs from 2026-08-31

#### Decision

Replace the planned P01 Alpha Moonshot target-model identity `kimi-k3` with Controller-directed `kimi-k2.7-code`. The Run Matrix remains authoritative; environment variables configure credentials and endpoint only. New Kimi run IDs use `KIMI27C` so they cannot collide with the historical `KIMI3` smoke attempt.

#### Reason and basis

- Controller review: explicit pre-Alpha model substitution decision.
- Technical observation: the historical `kimi-k3` smoke call exhausted the 4,096-token completion budget in reasoning and returned no visible answer.
- The decision does not change cases, prompts, conditions, scoring, schema, judges, or run order.

#### Provenance and comparability

The historical RAW file `outputs/raw/P01/P01_C01_BL_KIMI3_R01.json` is immutable and remains identified as the original `kimi-k3` smoke attempt. It must not be pooled with future `kimi-k2.7-code` results. No mini-pilot or Alpha result existed for Kimi at the time of this decision. Future returned model identity must be checked against `kimi-k2.7-code` during the Controller-approved smoke rerun.

---

### `DECISION_P01_2026_09_01_FINAL_BLOCK_B`

**Date:** 2026-09-01  
**Decision ID:** `DECISION_P01_2026_09_01_FINAL_BLOCK_B`  
**Decision Type:** `DESIGN_AND_IMPLEMENTATION`  
**Change Scope:** `P01_FINAL_ONLY`

Block B freezes the P01 Final construct, five-failure taxonomy, deterministic median/cross-repetition measurement, R=3 primary architecture, exactly two future R=5 reliability sentinel blocks, two-case Authority robustness architecture, two-judge S1–S4 schema, three-target portfolio, strict visible/hidden case boundary, and 408-generation reference geometry. P01 Final uses `kimi-k3`; this is prospective and does not alter the historical Alpha substitution to `kimi-k2.7-code` or any Alpha evidence. Future Final Run Matrix/config remains authoritative; `.env` contains no model override. Concrete cases, Authority/sentinel identities, and the exact Final Run Matrix remain deferred to Block C.
