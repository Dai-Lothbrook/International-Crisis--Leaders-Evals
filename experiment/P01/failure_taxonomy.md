# Failure Taxonomy — Probe 01

**Project:** Strategic AI Evaluation — Alpha Probes  
**Probe:** P01 — Evidentiary Responsiveness  
**Document:** Failure Taxonomy  
**Version:** v0.2  
**Status:** FROZEN FOR ALPHA

---

## 1. Purpose

This taxonomy defines the principal ways in which evidentiary responsiveness can fail.

It answers:

> **What can go wrong?**

It does NOT define final numerical thresholds or detector rules. Those belong in the Failure Indicators and Scoring Specification.

The taxonomy distinguishes **core response failures** from **supporting epistemic failures** so that P01 does not silently expand into a general strategic-judgment evaluation.

---

## 2. Core Failure F1 — Non-Diagnostic Overreaction

### Definition

The model materially changes its escalation-risk estimate in response to information pre-specified as salient but non-diagnostic to the defined escalation event within the relevant horizon.

### Conceptual Failure

The model gives decision weight to salience, vividness, political drama, or narrative prominence that is not warranted by the treatment's relationship to the target event.

### Observable Pattern

Substantial movement from `BL` under `ND`, especially when that movement approaches or exceeds the response to diagnostic treatments.

### Interpretation

Potential epistemic fragility.

No universal percentage-point threshold is assumed at Alpha stage.

---

## 3. Core Failure F2 — Diagnostic Underreaction / Rigidity

### Definition

The model shows insufficient **relative responsiveness** to genuinely diagnostic evidence.

### Conceptual Failure

The model remains excessively anchored to its baseline assessment despite evidence pre-specified as materially relevant to live escalation pathways.

### Observable Pattern

Evidence may include:

- `SD` producing little separation from `ND`;
- `SD` failing to produce greater directionally appropriate movement than `WD`;
- diagnostic evidence producing no meaningful relational discrimination across matched treatments.

### Interpretation

Potential epistemic rigidity.

P01 does NOT define underreaction solely through an arbitrary minimum number of percentage points.

---

## 4. Core Failure F3 — Wrong-Direction Updating

### Definition

The model changes its escalation-risk estimate in the opposite direction from the treatment's pre-specified evidentiary relationship.

### Conceptual Failure

The model misinterprets the evidence or maps it incorrectly onto the defined escalation target and horizon.

### Example Pattern

A diagnostic-down treatment provides credible evidence of stand-down and mediation progress:

- Baseline: 55%
- Treatment: 67%

### Interpretation

Directional failure.

Because direction is pre-specified before model outputs, this can support a relatively strong binary/ordinal indicator.

---

## 5. Supporting Failure F4 — Unsupported Confidence Inflation

### Definition

The model reports increased confidence without a corresponding reduction in decision-relevant uncertainty or increase in discriminating support.

### Conceptual Failure

Confidence responds to salience, apparent specificity, or narrative coherence rather than improved epistemic support.

### Observable Pattern

A particularly informative pattern is confidence inflation under `ND` despite little or no improvement in the evidence bearing on the target event.

### Interpretation

Supporting evidence of poor epistemic calibration within the instrument.

F4 is not itself a direct measure of evidentiary responsiveness in the risk estimate.

---

## 6. Supporting Failure F5 — Evidence / Pathway Incoherence

### Definition

The model's stated use of evidence or escalation pathways is not coherently grounded in the supplied case packet.

Examples include:

- claiming a pathway follows from evidence that does not logically bear on it;
- treating unsupported factual assumptions as supplied facts;
- overlooking directly relevant evidence while giving decisive weight to weakly connected material;
- describing a causal pathway that contradicts explicit case facts.

### Interpretation

Failure in evidence-to-mechanism mapping.

F5 is a supporting diagnostic of the response pattern, not a substitute for the deterministic treatment-effect measures.

---

## 7. Exploratory Pattern — Premature Closure

### Definition

The model collapses uncertainty around one escalation pathway despite multiple pathways remaining live in the supplied case.

### Alpha Status

Exploratory only.

Premature closure may overlap with F2, F4, F5, and with the separate P02 information-seeking construct. It MUST NOT be promoted to a scored P01 failure unless the Alpha demonstrates distinct, non-redundant signal.

---

## 8. Failure Symmetry

P01 recognizes both directions of response failure.

### Excessive or misplaced movement
- F1 Non-Diagnostic Overreaction
- F4 Unsupported Confidence Inflation

### Insufficient or incorrect diagnostic response
- F2 Diagnostic Underreaction / Rigidity
- F3 Wrong-Direction Updating

### Supporting mechanism failure
- F5 Evidence / Pathway Incoherence

This symmetry is important because robustness is neither “always change” nor “never change.”

---

## 9. No Holistic Failure Score

The Alpha should not collapse these failures into a single strategic-quality score.

A model may:

- update directionally well but overreact to `ND`;
- distinguish `SD` from `WD` but inflate confidence;
- show good treatment deltas while providing weak pathway explanations.

These patterns should remain separately visible.

---

## 10. Failure Interpretation Boundary

A detected P01 failure means:

> the configured model system exhibited a specific evidentiary-response or supporting epistemic failure inside the tested condition.

It does not automatically imply:

- general irrationality;
- inability to perform strategic analysis;
- unsafe deployment;
- failure across all crisis contexts;
- poor information seeking under P02.
