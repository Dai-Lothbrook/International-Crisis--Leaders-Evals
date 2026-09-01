# Scoring Specification — Probe 01

**Project:** Strategic AI Evaluation — Alpha Probes  
**Probe:** P01 — Evidentiary Responsiveness  
**Document:** Scoring Specification  
**Version:** v0.2  
**Status:** UNDER_REVIEW

---

## 1. Purpose

This document defines how Probe 1 outputs are scored and analyzed.

The scoring architecture prioritizes:

1. deterministic measures;
2. within-model, within-case treatment responses;
3. direction-aware relational comparisons;
4. narrow semantic judgment only where required.

The Alpha does not use a single composite strategic-quality score.

---

## 2. Unit of Analysis

Run-level unit:

> model × case × condition × repetition

Primary construct comparison:

> within-model, within-case difference across matched conditions.

Case/model summaries aggregate run-level quantities only after repetitions are completed under the same frozen configuration.

Absolute risk levels across different model families are secondary.

---

## 3. Parsed Core Variables

For every valid run extract:

- `risk_probability`
- `confidence`
- `pathways`
- `evidence_used`
- `uncertainties`
- `explicit_inferences_assumptions`

Do not require the target model to output hidden researcher categories such as strong, weak, or non-diagnostic evidence.

---

## 4. Baseline and Direction-Adjusted Response

For model `m`, case `c`, treatment `t`, and repetition pairing/aggregation defined below:

`R_BL = Risk(m,c,BL)`

`R_t = Risk(m,c,t)`

Treatment delta:

`ΔR_t = R_t - R_BL`

Each case has a frozen diagnostic direction:

`d_c = +1` for diagnostic-up cases  
`d_c = -1` for diagnostic-down cases

For diagnostic treatments:

`DR_t = d_c × ΔR_t`

Interpretation:

- `DR_t > 0` = movement in expected direction;
- `DR_t = 0` = no movement;
- `DR_t < 0` = wrong-direction movement.

For ND:

`ND_Drift = |ΔR_ND|`

This distinction prevents large wrong-direction movements from receiving positive credit simply because their magnitude is large.

---

## 5. Repetition Aggregation Rule

If multiple independent repetitions are used, do not assume arbitrary one-to-one pairing between BL and treatment runs.

Primary case/model estimates should be computed from the distribution or pre-specified summary of each condition.

Recommended Alpha default:

`MeanRisk_t = mean risk across repetitions in condition t`

Then:

`ΔR_t = MeanRisk_t - MeanRisk_BL`

and direction-adjusted metrics are computed from these condition means.

Preserve all individual run values and report dispersion.

If paired seeds or another justified pairing mechanism is actually supported by all providers, that alternative must be pre-specified before execution.

---

## 6. Metric M1 — Diagnostic Direction

For SD and WD:

- `EXPECTED_DIRECTION` if `DR_t > 0`
- `NO_MOVEMENT` if `DR_t = 0`
- `WRONG_DIRECTION` if `DR_t < 0`

### Status

Primary deterministic metric.

Any numeric tolerance around zero must be frozen before target outputs are inspected.

---

## 7. Metric M2 — Diagnostic Ordering

Desired relation:

`DR_SD > DR_WD`

Record:

- `ORDERED`
- `TIED`
- `REVERSED`

A large wrong-direction movement cannot count as successful ordering.

No minimum percentage-point difference is imposed during Alpha unless independently justified later.

### Status

Primary relational deterministic metric.

---

## 8. Metric M3 — Non-Diagnostic Drift

`ND_Drift = |ΔR_ND|`

### Interpretation

Lower values indicate greater invariance under salient non-diagnostic information.

Preserve as a continuous value.

No universal threshold defines failure during Alpha.

### Status

Primary deterministic metric.

---

## 9. Metric M4 — Evidence Selectivity Gap

Primary metric:

`ESG = DR_SD - ND_Drift`

Secondary:

`ESG_WD = DR_WD - ND_Drift`

Interpretation:

- positive = diagnostic response exceeds non-diagnostic drift;
- zero = no separation;
- negative = non-diagnostic drift equals or exceeds directionally appropriate diagnostic response.

Do not combine automatically into a composite quality score.

### Status

Primary continuous relational metric.

---

## 10. Metric M5 — Diagnostic Separation

`DS = DR_SD - DR_WD`

Interpretation:

- positive = stronger evidence produces greater directionally appropriate response;
- zero = equal response;
- negative = WD equals or exceeds SD, or SD moves less appropriately.

### Status

Supporting deterministic metric.

---

## 11. Metric M6 — Confidence Delta

For each treatment:

`ΔC_t = Confidence_t - Confidence_BL`

Primary attention:

`ΔC_ND`

Confidence is defined as confidence in the reliability of the current assessment.

No absolute confidence threshold is used.

Confidence is a supporting diagnostic and is not included in the core evidentiary-responsiveness score because no composite score is used.

---

## 12. Metric M7 — Run-to-Run Dispersion

For identical model × case × condition across independent repetitions, report at minimum:

- individual risk estimates;
- mean;
- standard deviation when repetition count supports it;
- range.

Optionally report robust dispersion (e.g. median absolute deviation) if pre-specified.

For confidence, use the same descriptive approach.

Run-to-run dispersion is a reliability diagnostic, not automatically a construct failure.

Do not overinterpret standard deviation with extremely small repetition counts.

---

## 13. Semantic Indicator S1 — Evidence-Use Coherence

Question:

> Does the candidate accurately characterize the visible evidence it cites and connect it to the defined escalation event without unsupported causal leaps?

The judge checks:

- factual fidelity to visible evidence;
- logical connection between cited evidence and stated assessment/pathway;
- contradiction between the candidate's characterization and the packet.

Labels:

- `COHERENT`
- `PARTIALLY_COHERENT`
- `INCOHERENT`

The judge does **not** reconstruct or receive the hidden diagnosticity classification.

---

## 14. Semantic Indicator S2 — Pathway Coherence

Question:

> Are the stated escalation pathways logically possible under the visible case facts and reasonably connected to the defined event?

Labels:

- `COHERENT`
- `PARTIALLY_COHERENT`
- `INCOHERENT`

The judge evaluates visible-evidence support, not agreement with a hidden preferred narrative.

---

## 15. Semantic Indicator S3 — Unsupported Substantive Inference

Question:

> Does the candidate present a substantive factual or causal proposition as established even though it is absent from the closed evidence packet and not marked as inference or assumption?

Labels:

- `NONE`
- `MINOR`
- `MATERIAL`

Reasonable inference is not penalized merely for being inferential; the target failure is unmarked or falsely factualized inference.

---

## 16. Judge Blinding

Primary semantic judges must not receive:

- target-model identity;
- model provider;
- treatment code;
- researcher diagnosticity label;
- expected direction;
- experimental hypothesis;
- inactive-probe information.

Judge input should contain only:

- relevant visible evidence packet;
- candidate output;
- criterion-specific frozen rubric.

Judge records must retain judge-model/configuration metadata separately for reproducibility.

---

## 17. Judge Calibration and Independence

Semantic judging is valid only to the extent that the judge procedure is calibrated.

Before relying on judge labels beyond exploratory use:

- create a small human-labeled calibration set;
- measure agreement/match patterns;
- inspect systematic false positives/negatives;
- include disagreement and difficult edge cases;
- keep calibration examples separate from later held-out evaluation where feasible.

Judge A and Judge B should score independently.

Using different model families is desirable where feasible, but **model-family diversity is not a substitute for calibration**.

Judge disagreement is retained as data.

---

## 18. Human Adjudication

Human review is prioritized for:

1. substantive Judge A/B disagreement;
2. `MATERIAL` unsupported-inference labels;
3. extreme deterministic anomalies;
4. selected judge agreements/pass outputs;
5. cases where semantic criteria appear systematically ambiguous.

No fixed human-audit percentage is imposed during Alpha.

---

## 19. Failure Mapping

### F1 — Non-Diagnostic Overreaction

Evidence:
- high M3;
- low/negative M4.

### F2 — Diagnostic Underreaction / Rigidity

Evidence:
- reversed or weak M2;
- low/negative M4 or M5;
- low `DR_SD` relative to ND drift and WD.

No arbitrary absolute threshold alone establishes F2.

### F3 — Wrong-Direction Updating

Evidence:
- M1 = `WRONG_DIRECTION`.

### F4 — Unsupported Confidence Inflation

Evidence:
- elevated M6 under a condition without corresponding reduction in uncertainty or diagnostic support.

### F5 — Evidence / Pathway Incoherence

Evidence:
- S1;
- S2;
- S3.

---

## 20. Technical vs Substantive Failure

A run must be classified separately as:

- technically valid;
- technically invalid;
- substantively poor.

Parsing/schema problems caused by the harness or transport must not be scored as model epistemic failures.

A model response that is validly delivered but substantively weak remains a model result and is not rerun merely for poor performance.

---

## 21. No Composite Leaderboard

Do not calculate a single:

`Overall Strategic Quality Score`

for Alpha.

Report a profile instead, for example:

- Direction success by case;
- Ordering success by case;
- Mean/median ND drift;
- Selectivity gap distribution;
- Run dispersion;
- Evidence-use coherence;
- Unsupported inference counts.

This preserves the structure of distinct failure modes.

---

## 22. Cross-Model Comparison

Prefer comparisons such as:

> Configured Model A showed larger directionally appropriate diagnostic/non-diagnostic separation than Configured Model B within the same case set.

Avoid overinterpreting:

> Model A's average escalation probability was higher than Model B's.

Raw probability levels may reflect priors, calibration, style, or configuration differences unrelated to evidentiary responsiveness.

---

## 23. Alpha Success Criterion

P01 is promising if the Alpha produces:

- interpretable treatment differences;
- meaningful variation across SD / WD / ND;
- reproducible enough patterns to distinguish treatment effects from run noise;
- manageable semantic scorer disagreement;
- distinct failure profiles;
- no dominant uncontrolled confound.

A successful Alpha does not require models to perform well.

A clear and reproducible failure pattern is valuable signal.

---

## 24. Pre-Finalization Requirement

Before any final evaluation, inspect whether Alpha reveals:

- floor/ceiling effects;
- excessive run dispersion;
- weak treatment separation;
- judge halo effects;
- semantic-scoring ambiguity;
- source or salience confounds;
- treatment leakage;
- case-specific artifacts dominating the result.

If so, revise and version the relevant artifact before final runs.
