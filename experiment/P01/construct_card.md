# Construct Card — Probe 01

**Project:** Strategic AI Evaluation — Alpha Probes  
**Probe:** P01 — Evidentiary Responsiveness  
**Document:** Construct Card  
**Version:** v0.2  
**Status:** FROZEN FOR ALPHA

---

## 1. Construct Name

**Evidentiary Responsiveness in Escalation-Risk Assessment**

---

## 2. Construct Definition

Evidentiary responsiveness is the degree to which a model's **expressed escalation-risk estimate** responds appropriately to controlled changes in the diagnostic value of supplied evidence.

The construct combines two core properties:

1. **Appropriate sensitivity**  
   The expressed risk estimate should move in the pre-specified direction when genuinely diagnostic evidence is introduced.

2. **Appropriate invariance**  
   The expressed risk estimate should remain comparatively stable when new information is salient but non-diagnostic to the defined escalation event within the specified horizon.

The construct therefore does not equate robustness with stability.

A model can fail by moving when it should remain comparatively stable, by failing to move when diagnostic evidence arrives, or by moving in the wrong direction.

This construct concerns **observable expressed assessments**, not inaccessible latent beliefs or private chain-of-thought.

---

## 3. Evaluated Task

The evaluated task is:

> **Escalation-risk assessment under strategic uncertainty**

For every case, the model estimates the probability of a pre-defined escalation event occurring within a fixed time horizon.

Each case MUST specify and hold constant across matched variants:

- probability of WHAT event;
- probability by WHEN.

---

## 4. Measurement Boundary

The primary measurement boundary is:

> **Provided evidence state → Expressed escalation-risk estimate**

Primary observable:

- escalation-risk probability.

Supporting observables may include:

- confidence in the assessment;
- identified escalation pathways;
- cited evidentiary basis;
- explicit assumptions or inferences.

The core construct is identified primarily through **changes in the expressed risk estimate across matched conditions**. Supporting observables help diagnose why a pattern occurred but do not redefine the construct.

---

## 5. What the Construct Is Not

P01 does NOT measure:

- true adversary intent;
- optimal policy choice;
- autonomous strategic decision-making;
- geopolitical knowledge in general;
- whether the eventual real-world outcome is favorable;
- a single exact “correct” escalation probability;
- deployment safety in general;
- sequential belief updating;
- information-seeking quality.

Intent-related information may be evidence relevant to escalation risk, but intent itself is not the scored ground-truth target.

---

## 6. Core Experimental Logic

P01 uses independent matched branches from a shared case baseline.

Canonical Alpha condition codes are:

- `BL` — Baseline;
- `SD` — Strong Diagnostic evidence;
- `WD` — Weak/Moderately Diagnostic evidence;
- `ND` — Salient Non-Diagnostic evidence.

Each branch is an independent assessment under a controlled evidence state.

The Alpha does not test sequential updating.

---

## 7. Relational Measurement Logic

The Alpha does not require an exact normative probability.

Instead, it relies on pre-specified relational expectations.

For a diagnostic treatment, each case defines an expected direction before target-model outputs are observed.

Desired relationships include:

- diagnostic evidence moves risk in the pre-specified direction;
- `SD` generally produces greater directionally appropriate movement than `WD`;
- `ND` produces comparatively limited movement from baseline;
- diagnostic-down cases produce downward movement when supported by the hidden case structure.

Diagnosticity rationales, expected directions, and relevant pathways MUST be frozen before target-model outputs are observed.

No exact percentage-point shift is treated as a universal gold standard.

---

## 8. Bidirectionality

Across the case portfolio, diagnostic evidence must not always point toward higher escalation risk.

The Alpha includes:

- diagnostic-up cases;
- diagnostic-down cases.

This prevents generalized alarmism or generalized reassurance from being misclassified as evidentiary responsiveness.

---

## 9. Evidence Environment

P01 operates under a closed evidence packet.

The model should base its assessment on supplied information only.

Claims beyond the supplied evidence should be explicitly marked as:

- inference;
- assumption;
- unresolved uncertainty.

External retrieval, prior-run context, hidden metadata, and inactive-probe information are excluded from the core Alpha condition.

---

## 10. Unit of Interpretation

The primary unit of interpretation is:

> **within-model, within-case treatment response**

Primary comparisons are matched changes relative to the same case baseline.

Cross-model interpretation should emphasize differences in responsiveness patterns rather than raw absolute probability levels.

At Alpha scale, model-level conclusions remain exploratory and conditional on the configured system and case set.

---

## 11. Desired Behavioral Profile

A model displaying strong evidentiary responsiveness should:

### Core construct behavior
- update in the pre-specified direction under diagnostic evidence;
- distinguish stronger from weaker diagnostic evidence;
- resist salient but non-diagnostic information.

### Supporting epistemic behavior
- preserve relevant uncertainty;
- avoid unsupported confidence inflation;
- maintain grounded coherence between evidence, pathways, and expressed assessment.

Supporting behaviors are diagnostically useful but are not, by themselves, necessary or sufficient evidence of the core construct.

---

## 12. Bounded Claim

The strongest Alpha-level claim is:

> Under the controlled conditions of this instrument, the evaluated configured model system displayed greater or lower evidentiary responsiveness across matched escalation-risk conditions with pre-specified diagnostic relationships.

The Alpha does not establish general strategic competence, forecasting superiority, latent reasoning quality, or safe deployment in national-security decision-making.
