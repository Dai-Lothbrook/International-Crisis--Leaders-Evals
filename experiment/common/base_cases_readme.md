# Base Cases — Shared Alpha Portfolio (P01 Active)

**Project:** Strategic AI Evaluation — Alpha Probes  
**Component:** Base Case Portfolio  
**Version:** v1.1-controller-patched  
**Status:** CONTROLLER-PATCHED — CASE-PACKAGE FREEZE PENDING

---

## 1. Purpose

The Base Case Portfolio contains four synthetic strategic microworlds used by the Alpha evaluation architecture.

The cases are **not** a statistical sample of geopolitical crises.

They are deliberately constructed experimental environments designed to expose a common bounded task:

> strategic event-risk assessment under uncertainty using a closed evidence packet.

For the current phase, **P01 is active** and evaluates evidentiary responsiveness. The same shared worlds may later support P02, but P02 metadata is inactive and must remain isolated during P01 execution.

Case diversity reduces the chance that an observed response pattern is merely an artifact of one narrative.

The Alpha is primarily a **mechanism and measurement-architecture test**, not an estimate of population-level model performance.

---

## 2. Canonical Case Portfolio

### C01 — Diagnostic Up

**Package:** `C01_DU_NERIS_STRAIT`  
**Base world:** `C01_BASE_WORLD`  
**Execution role:** `core_identification`

Primary role:

> test whether stronger target-linked evidence moves the model's expressed event-risk estimate upward relative to baseline and weaker evidence.

---

### C02 — Diagnostic Down

**Package:** `C02_DD_KELDA_CORRIDOR`  
**Base world:** `C02_BASE_WORLD`  
**Execution role:** `core_identification`

Primary role:

> test whether strong diagnostic evidence can move the estimate downward when it verifiably reverses or constrains the relevant escalation pathway.

C02 provides bidirectionality and helps distinguish genuine evidentiary responsiveness from generalized alarmism or one-direction risk inflation.

---

### C03 — Salience / Invariance

**Package:** `C03_SI_KALDOR_PASS`  
**Base world:** `C03_BASE_WORLD`  
**Execution role:** `core_identification`

Primary role:

> test whether the model avoids materially shifting event-risk assessment in response to vivid, crisis-adjacent information that has limited diagnostic value for the defined event and horizon.

C03 is the portfolio's most explicit invariance/salience case.

---

### C04 — Conflicting / Dependent Evidence Stress Test

**Package:** `C04_CDE_LUME_CORRIDOR`  
**Base world:** `C04_BASE_WORLD`  
**Execution role:** `secondary_stress_test`

Primary role:

> test whether evidentiary selectivity survives a more difficult evidence environment involving apparent corroboration, source dependence, conflict, and incomplete independent verification.

C04 is **not** treated as a perfectly matched clean-identification case. Source-family structure is intentionally part of the difficulty being tested and must remain explicit in analysis.

---

## 3. Shared Case Requirements

Every Alpha case must contain:

- a clearly defined assessment time;
- a fixed forecast horizon;
- a precise target event;
- explicit inclusion/exclusion criteria;
- multiple plausible pathways;
- controlled baseline ambiguity;
- a closed evidence packet;
- no single trivially dominant baseline interpretation;
- a model-visible / researcher-only boundary;
- a renderer allowlist or equivalent visible-field contract.

---

## 4. Canonical P01 Treatment Architecture

Every P01 case supports four independent conditions:

- `BL` — Baseline
- `SD` — Strong Diagnostic
- `WD` — Weak / Moderately Diagnostic
- `ND` — Non-Diagnostic or approximately invariant treatment

These are the only canonical execution codes for the current P01 Alpha.

Legacy labels such as `WM` or `SND` must not appear in new execution artifacts.

For the current design:

- `SD` should produce the strongest directed response;
- `WD` should generally produce a weaker directed response in the same case-level direction;
- `ND` should remain approximately invariant relative to baseline.

Exact effect magnitudes are **not** pre-specified as golden probabilities.

---

## 5. Shared World / Probe Separation

Each case package may contain:

### Shared world

- actors;
- timeline;
- event target;
- horizon;
- crisis context;
- baseline facts.

### P01 support

- P01 treatment variants;
- researcher diagnosticity metadata;
- expected direction;
- evidentiary rationale;
- source-family information relevant to the treatment design.

### P02 support

May exist in the same case package but is inactive during P01 execution.

P02 information must never be exposed in a P01 run.

The Run Matrix stores only provenance/reference fields. The **actual model-visible case context comes from the case package through the renderer**, not from the spreadsheet row.

---

## 6. Visible / Hidden Boundary

The target model may see only explicitly model-visible material selected by the renderer.

Researcher-side material may additionally include:

- diagnosticity;
- expected direction;
- source-family relationships;
- pathway mapping;
- treatment rationale;
- anticipated confounds;
- P02 support metadata;
- expected relational properties.

These researcher-side fields are measurement apparatus, not target-model evidence.

The JSONL package itself must never be serialized wholesale into the target-model prompt.

---

## 7. Diagnosticity Requirement

No treatment receives a diagnosticity label merely because the researcher calls it strong, weak, or non-diagnostic.

For every `SD`, `WD`, and `ND` item, the hidden specification must explain:

1. which defined target event it bears on;
2. through which pathway(s);
3. why the expected case-level direction follows, if any;
4. why the relationship matters within the fixed horizon;
5. why its diagnosticity differs from the matched alternatives;
6. whether source dependence changes how apparent corroboration should be interpreted.

These rationales must predate target-model outputs.

---

## 8. Treatment Matching

For the clean-identification cases, variants should be matched as closely as feasible on:

- source family;
- credibility;
- tone;
- specificity;
- length;
- timing;
- directness;
- reporting confidence;
- general salience.

Known mismatches must remain documented as case-level limitations.

### C04 exception

C04 intentionally manipulates a harder evidence-structure problem. Its WD condition involves apparent corroboration that collapses to a dependent upstream source, while SD provides stronger independent target-linked evidence.

Therefore, source-family equivalence is **not** a matching requirement for C04 in the same way it is for C01–C03.

C04 should be analyzed as a **secondary stress test**, not silently pooled as though it were a clean matched-treatment identification case.

---

## 9. Case-Specific Controller Notes

### C01

- diagnostic-up architecture is suitable for the core identification set;
- hidden treatment rationales must be frozen with the package;
- ND is military and salient but should receive a pilot difficulty check to confirm it is not trivially dismissed.

### C02

- diagnostic-down architecture provides required bidirectionality;
- ND visible wording should avoid directly explaining why it is independent of the offensive fires decision;
- hidden rationale may preserve that researcher-side logic.

### C03

- ND is deliberately vivid and crisis-adjacent;
- pilot inspection should verify that the verified civilian origin does not make the invariance task so easy that it ceases to discriminate;
- any change after target outputs would require a new version.

### C04

- the source-dependence asymmetry is deliberate;
- preserve the provenance map;
- treat outputs as robustness/stress-test evidence rather than a directly exchangeable replicate of C01–C03.

---

## 10. Case Roles Are Complementary

The four cases form a small diagnostic portfolio:

> **C01:** Does the model move upward when warranted?

> **C02:** Can it also move downward when warranted?

> **C03:** Can it avoid moving materially when vivid evidence is non-diagnostic?

> **C04:** Does that selectivity survive conflicting and dependent evidence?

The portfolio is therefore intentionally asymmetric in function.

Do not reduce it to a single undifferentiated four-case mean.

---

## 11. Case Freeze Rule

Before a case enters full Alpha execution, freeze:

- package ID and version;
- base-world ID and version;
- model-visible baseline;
- model-visible treatments;
- event definition;
- horizon;
- inclusion/exclusion criteria;
- hidden rationale;
- diagnosticity classification;
- expected direction;
- source-family/dependence map;
- known confounds;
- renderer allowlist / visible-field contract.

Recommended additional provenance:

- file hash of the frozen JSONL package.

Substantive post-run changes require:

1. a new case version;
2. an entry in the Design Decision Log;
3. no silent pooling of pre-change and post-change runs.

---

## 12. Vertical-Slice Role

C01 is the initial vertical slice used to verify:

- renderer behavior;
- treatment exposure;
- prompt compatibility;
- response-schema compatibility;
- hidden/visible separation;
- deterministic scoring feasibility;
- provider routing and storage.

C01 should not be privileged analytically merely because it was constructed first.

The initial smoke test may use C01-BL provider calls while dry-rendering all four C01 conditions to inspect treatment assembly without unnecessary API calls.

---

## 13. Dataset Interpretation Boundary

The four-case Alpha portfolio supports bounded mechanism testing and instrument evaluation.

It does **not** support claims that:

- the cases statistically represent all geopolitical crises;
- average model performance estimates real-world prevalence;
- the observed treatment effect generalizes to every strategic context;
- one model is globally "better at foreign policy";
- the Alpha alone establishes deployment safety.

The purpose is diagnostic identification and architecture validation, not population inference.

---

## 14. Pre-Run Freeze Checklist

Before full P01 execution:

1. confirm the exact JSONL file for C01–C04;
2. apply Controller-approved wording patches to the source packages where required;
3. verify canonical `BL/SD/WD/ND` codes;
4. verify package/version identifiers against the Run Matrix;
5. verify P02 metadata cannot enter P01 rendering;
6. verify hidden rationales predate target outputs;
7. dry-render C01 BL/SD/WD/ND;
8. run the three-provider smoke test;
9. log any changes before the mini-pilot;
10. freeze the final package versions before the remaining Alpha runs.

Until these checks are complete, the portfolio is Controller-patched but not yet execution-frozen.
