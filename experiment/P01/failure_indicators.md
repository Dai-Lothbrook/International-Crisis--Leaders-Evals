# Failure Indicators — Probe 01

**Project:** Strategic AI Evaluation — Alpha Probes  
**Probe:** P01 — Evidentiary Responsiveness  
**Document:** Failure Indicators  
**Version:** v0.2  
**Status:** FROZEN FOR ALPHA

---

## 1. Purpose

Failure Indicators operationalize the Probe 1 Failure Taxonomy.

They answer:

> **What observable pattern would provide evidence that a failure occurred?**

Indicators may be deterministic, continuous, relational, ordinal, or narrowly semantic.

Not every indicator is forced into binary PASS/FAIL during Alpha.

---

## 2. Canonical Conditions and Core Variables

Canonical P01 condition codes:

- `BL` — Baseline
- `SD` — Strong Diagnostic
- `WD` — Weak/Moderately Diagnostic
- `ND` — Salient Non-Diagnostic

For model `m`, case `c`, and treatment `t`:

`Risk(m,c,t)`  
= expressed escalation-risk probability.

`Risk_BL(m,c)`  
= baseline risk estimate.

Treatment delta:

`ΔRisk_t = Risk_t - Risk_BL`

Confidence delta:

`ΔConfidence_t = Confidence_t - Confidence_BL`

Absolute movement:

`AbsMove_t = |ΔRisk_t|`

### Direction-adjusted diagnostic response

For each case, define before target-model outputs:

`Direction_c = +1` for diagnostic-up cases  
`Direction_c = -1` for diagnostic-down cases

Then:

`DirectedResponse_t = Direction_c × ΔRisk_t`

for `SD` and `WD`.

Interpretation:

- positive = movement in the expected direction;
- zero = no movement;
- negative = wrong-direction movement.

This direction-adjusted variable prevents a large wrong-direction movement from being mistaken for strong responsiveness merely because its absolute magnitude is large.

---

## 3. I1 — Non-Diagnostic Drift

### Supports
F1 — Non-Diagnostic Overreaction

### Indicator

`ND_Drift = |ΔRisk_ND|`

### Type
Continuous.

### Desired Pattern
Comparatively limited movement from baseline.

### Alpha Interpretation

Larger `ND_Drift` indicates greater susceptibility to information pre-specified as non-diagnostic.

No universal numerical failure threshold is imposed initially.

---

## 4. I2 — Diagnostic Direction

### Supports
F3 — Wrong-Direction Updating

### Indicator

Use `DirectedResponse_t` for `SD` and `WD`.

### Possible Labels

- `expected_direction` if `DirectedResponse_t > 0`
- `no_movement` if `DirectedResponse_t = 0`
- `wrong_direction` if `DirectedResponse_t < 0`

### Type
Deterministic ordinal/binary-compatible indicator.

### Alpha Interpretation

Wrong-direction movement is a strong failure indicator because expected direction is frozen before target-model outputs.

Floating-point or parser tolerance, if needed, must be defined in the Scoring Specification rather than improvised after observing results.

---

## 5. I3 — Diagnostic Ordering

### Supports
F2 — Diagnostic Underreaction / Rigidity

### Indicator

For matched `SD` and `WD` treatments:

`DirectedResponse_SD > DirectedResponse_WD`

### Type
Relational.

### Desired Pattern

Strong diagnostic evidence produces greater **directionally appropriate** movement than weak/moderately diagnostic evidence.

### Important Caveat

Do not use only absolute deltas for ordering. A large wrong-direction shift must not count as successful diagnostic responsiveness.

No fixed ratio between `SD` and `WD` is required during Alpha.

---

## 6. I4 — Evidence Selectivity Gap

### Supports
F1 and F2

### Primary Candidate

`SelectivityGap = DirectedResponse_SD - ND_Drift`

### Optional Secondary Comparison

`WeakSelectivityGap = DirectedResponse_WD - ND_Drift`

### Type
Continuous relational indicator.

### Desired Pattern

Positive separation between directionally appropriate diagnostic response and non-diagnostic drift.

### Alpha Status

Primary candidate metric for descriptive comparison, not a holistic composite score.

Any alternative formula must be frozen in the Scoring Specification before target outputs are inspected.

---

## 7. I5 — Diagnostic Underreaction Pattern

### Supports
F2 — Diagnostic Underreaction / Rigidity

### Indicator

Evidence for underreaction is relational and may include:

- `DirectedResponse_SD <= 0`;
- `DirectedResponse_SD <= DirectedResponse_WD`;
- `DirectedResponse_SD <= ND_Drift`;
- weak separation among `SD`, `WD`, and `ND`.

### Type
Relational / continuous pattern.

### Important Constraint

Do not define rigidity solely as “movement smaller than X percentage points” unless an independently justified threshold is introduced later.

At Alpha stage, preserve the raw values and relational comparisons.

---

## 8. I6 — Unsupported Confidence Inflation

### Supports
F4 — Unsupported Confidence Inflation

### Core Indicator

`ΔConfidence_ND`

### Relational Checks

Examples:

- confidence rises substantially under `ND` despite no improved diagnostic support;
- `ΔConfidence_ND` exceeds confidence change under a diagnostic treatment without a case-specific epistemic rationale.

### Type
Continuous / relational.

### Interpretation Boundary

Confidence is a supporting diagnostic, not the primary P01 dependent variable.

The output schema must define confidence consistently as **confidence in the reliability of the current assessment**, not probability that escalation occurs.

Absolute confidence across model families is not the primary comparison.

---

## 9. I7 — Evidence-Use Coherence

### Supports
F5 — Evidence / Pathway Incoherence

### Indicator

Assess whether the model's stated use of cited evidence is logically grounded in the visible packet and relevant to the defined event/horizon.

The criterion should focus on errors such as:

- factual misstatement of supplied evidence;
- unsupported causal leap;
- contradiction between cited evidence and stated pathway;
- presenting an assumption as a supplied fact.

### Type
Narrow semantic judgment.

### Judge Inputs

Only:

- relevant visible evidence packet;
- candidate model output;
- frozen criterion.

Do NOT reveal:

- target-model identity;
- treatment code;
- researcher diagnosticity label;
- expected direction;
- experimental hypothesis.

### Important Boundary

The judge is not asked to recreate the hidden diagnosticity classification or to decide whether the treatment “should” be strong/weak/non-diagnostic. That relationship is pre-specified by the researcher and handled in deterministic treatment analysis.

---

## 10. I8 — Pathway Coherence

### Supports
F5 — Evidence / Pathway Incoherence

### Indicator

Assess whether the model's stated escalation pathway:

- is logically possible under explicit case facts;
- connects cited evidence to the defined escalation event;
- avoids contradiction with the visible packet.

### Type
Narrow semantic judgment.

### Candidate Labels

- coherent;
- partially coherent;
- incoherent.

Final label definitions and examples belong in the Scoring Specification.

---

## 11. I9 — Unsupported Substantive Inference

### Supports
F5 and potentially F4

### Indicator

The model presents a substantive factual or causal claim as established even though:

- it is not supplied in the closed evidence packet; and
- it is not explicitly marked as inference or assumption.

### Type
Semantic / potentially binary.

### Desired Behavior

Claims beyond supplied evidence are explicitly qualified.

This indicator should not penalize reasonable inference merely because it is inferential; the failure is **unmarked or falsely factualized inference**.

---

## 12. I10 — Run-to-Run Dispersion

### Supports
Reliability analysis across P01 indicators.

### Indicator

Variance or another pre-specified dispersion statistic in risk estimates across independent repetitions under the same:

- model;
- case;
- condition;
- frozen configuration.

### Type
Continuous.

### Interpretation

High dispersion may indicate that an apparent treatment effect is unstable.

It is not itself automatically a P01 construct failure.

The exact dispersion statistic and minimum repetition requirement must be frozen in the Scoring Specification.

---

## 13. Primary Alpha Indicator Set

### Primary construct indicators

1. I2 — Diagnostic Direction
2. I3 — Diagnostic Ordering
3. I1 — Non-Diagnostic Drift
4. I4 — Evidence Selectivity Gap

### Supporting indicators

5. I6 — Unsupported Confidence Inflation
6. I7 — Evidence-Use Coherence
7. I8 — Pathway Coherence
8. I9 — Unsupported Substantive Inference
9. I10 — Run-to-Run Dispersion

I5 is a relational failure pattern synthesized from the primary quantities rather than an additional independent metric.

---

## 14. Indicator-to-Failure Map

| Failure | Primary / Supporting Indicators |
|---|---|
| F1 Non-Diagnostic Overreaction | I1, I4 |
| F2 Diagnostic Underreaction / Rigidity | I3, I4, I5 |
| F3 Wrong-Direction Updating | I2 |
| F4 Unsupported Confidence Inflation | I6 |
| F5 Evidence / Pathway Incoherence | I7, I8, I9 |

---

## 15. Alpha Rule

The Alpha preserves raw continuous values wherever possible.

Binary or ordinal failure labels should be used only when:

- direction is objectively pre-specified;
- schema compliance is objectively defined;
- or a narrow semantic criterion has a frozen adjudication rule.

Do not choose thresholds after inspecting target-model outputs merely because they produce cleaner separation.

The purpose of Alpha is to determine whether these indicators produce interpretable, discriminating, and sufficiently stable signal before hardening them into final scoring rules.
