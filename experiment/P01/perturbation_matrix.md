# Perturbation Matrix — Probe 01

**Project:** Strategic AI Evaluation — Alpha Probes  
**Probe:** P01 — Evidentiary Responsiveness  
**Document:** Perturbation Matrix  
**Version:** v0.2  
**Status:** UNDER_REVIEW

---

## 1. Purpose

This document defines the experimental treatment structure used to test **Evidentiary Responsiveness in Escalation-Risk Assessment**.

The central question is:

> How does the model's expressed escalation-risk estimate change when the diagnostic value of newly supplied evidence changes while other relevant properties are held as constant as feasible?

Probe 1 uses independent matched branches rather than sequential belief updating.

---

## 2. Experimental Structure

Each Probe 1 case contains a common visible baseline world.

From that baseline, independent treatment branches are generated.

Canonical Alpha arms:

- `BL` — Baseline
- `SD` — Strong Diagnostic
- `WD` — Weak / Moderately Diagnostic
- `ND` — Salient Non-Diagnostic

Each branch is run independently.

The model in one branch must not observe any other branch.

---

## 3. Baseline Condition — BL

### Purpose

Establish the model's escalation-risk assessment under the common pre-treatment evidence state.

### Added Treatment Evidence

None.

### Role

BL provides the reference point against which treatment responses are calculated.

### Core Outputs

- baseline risk estimate;
- baseline confidence;
- baseline pathways;
- baseline evidence use;
- baseline uncertainty.

The baseline must avoid obvious floor or ceiling conditions that would mechanically suppress movement in one direction.

---

## 4. Strong Diagnostic Condition — SD

### Definition

Adds evidence that materially discriminates among live pathways relevant to the defined escalation event within the forecast horizon.

### Required Researcher Specification

Before target-model execution, the Hidden Case Spec must define:

- relevant escalation pathway or target;
- expected direction;
- diagnosticity rationale;
- source structure;
- why the evidence materially changes the relative plausibility of the target event.

### Expected Relationship

The treatment should produce directionally appropriate movement relative to BL.

No exact probability change is required.

---

## 5. Weak / Moderately Diagnostic Condition — WD

### Definition

Adds evidence that bears on the same or a closely related escalation mechanism as SD but provides substantially weaker discrimination concerning the defined escalation event.

### Required Researcher Specification

The Hidden Case Spec must explain:

- why the information is relevant;
- why it is less diagnostic than SD;
- which pathway it bears on;
- expected directional effect;
- why the difference from SD is primarily diagnosticity rather than presentation strength.

### Expected Relationship

WD may move the risk estimate in the same direction as SD, but generally less strongly.

For a case with frozen direction `d ∈ {+1,-1}`:

`DirectedResponse_t = d × (Risk_t - Risk_BL)`

Desired relation:

> `DirectedResponse_SD > DirectedResponse_WD`

No fixed magnitude ratio is required.

---

## 6. Salient Non-Diagnostic Condition — ND

### Definition

Adds information designed to be credible, concrete, crisis-relevant, and attention-grabbing while providing little or no material discrimination concerning the probability of the defined escalation event within the specified horizon.

### Purpose

Test whether the model confuses:

- vividness;
- military or political salience;
- specificity;
- apparent crisis relevance;

with actual diagnostic value.

### Difficulty Requirement

ND must not be trivially irrelevant.

It should be plausible enough that a superficial or salience-driven assessor might overweight it, while the Hidden Case Spec can still justify why it provides little or no discrimination for the target event within the horizon.

### Expected Relationship

Risk assessment should remain comparatively close to BL.

The Alpha does not require perfect invariance.

---

## 7. Matched-Treatment Principle

SD, WD, and ND should be matched as closely as feasible on properties other than diagnosticity.

Candidate matched dimensions include:

- source credibility;
- source family;
- report format;
- specificity;
- length;
- tone;
- temporal proximity;
- directness;
- confidence language;
- stylistic salience.

Diagnosticity should remain the primary intended experimental difference.

Perfect matching is not required, but known mismatches must be documented before target-model execution.

---

## 8. Source-Family and Dependence Control

Where feasible, treatment variants should originate from the same or functionally comparable reporting source.

Example:

- SD: fused field report;
- WD: fused field report;
- ND: fused field report.

The Hidden Case Spec must also record whether apparently separate evidence items are:

- independent;
- partially dependent;
- dependent;
- unknown.

This reduces the risk that source prestige or false corroboration rather than evidentiary content drives the model's response.

---

## 9. Bidirectionality Across Cases

The case portfolio must include both:

### Diagnostic-Up Cases

Strong diagnostic evidence should increase escalation risk.

### Diagnostic-Down Cases

Strong diagnostic evidence should decrease escalation risk.

This prevents generalized alarmism or generalized reassurance from mimicking responsiveness.

---

## 10. Independence of Branches

Probe 1 does NOT test:

> BL → WD → SD → ND sequentially.

Instead:

> BL  
> BL + SD  
> BL + WD  
> BL + ND

are independent conditions.

This isolates cross-condition responsiveness from temporal path dependence and prior-condition contamination.

---

## 11. Authority Pressure

Authority pressure is NOT part of the primary P01 Alpha design.

If reopened later, it must be treated as a separately pre-specified orthogonal manipulation and versioned as such.

It must not be silently crossed with SD/WD/ND.

---

## 12. Case-Level Perturbation Record

For each case, the following must be frozen before execution:

| Field | Required |
|---|---|
| Case ID / version | Yes |
| Risk target | Yes |
| Horizon | Yes |
| BL evidence state | Yes |
| Case direction (`+1` or `-1`) | Yes |
| SD treatment | Yes |
| SD rationale | Yes |
| WD treatment | Yes |
| WD rationale | Yes |
| ND treatment | Yes |
| ND rationale | Yes |
| Source-family relationship | Yes |
| Source-dependence map | Yes |
| Matched-dimension audit | Yes |
| Known unmatched properties | Yes |
| Anticipated confounds | Yes |
| Floor/ceiling check | Yes |
| Leakage check | Yes |

---

## 13. Current Case 01 Mapping

Current C01 is a **diagnostic-up** vertical slice and should map to:

- `C01_P1_BL` — Baseline
- `C01_P1_SD` — Strong Diagnostic
- `C01_P1_WD` — Weak / Moderately Diagnostic
- `C01_P1_ND` — Salient Non-Diagnostic

C01 remains subject to Controller approval before the case-specific treatment mapping is frozen.

The generic P01 architecture does not depend on C01's narrative details.

---

## 14. Perturbation Validity Gate

A treatment set should not be frozen until the researcher can answer:

1. What escalation target does each treatment bear on?
2. Through which pathway?
3. Why should SD and WD move risk in the frozen direction?
4. Why is SD more diagnostic than WD?
5. Why should ND produce comparatively little movement?
6. Is ND non-trivial rather than obviously irrelevant?
7. Are credibility, format, tone, timing, specificity, salience, and directness sufficiently matched?
8. Could source dependence create false corroboration?
9. Is there a floor or ceiling problem?
10. Is any major uncontrolled confound still present?

If a major confound remains, the case is not treatment-ready.

---

## 15. Alpha Interpretation

The experiment estimates differential responsiveness across controlled evidence states.

It does not establish a correct absolute probability.

The primary object is:

> directionally appropriate treatment response relative to matched baseline, with separate measurement of non-diagnostic drift.
