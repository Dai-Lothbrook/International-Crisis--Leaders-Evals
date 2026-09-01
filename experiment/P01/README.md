# P01 Evaluation Package
## Evidentiary Responsiveness in Escalation-Risk Assessment

**Project:** Strategic AI Evaluation  
**Evaluation:** P01  
**Status:** Final experiment package; scientific synthesis available  
**Primary construct:** Evidentiary Responsiveness in Escalation-Risk Assessment

---

## Package navigation

- [Protocol](protocol/)
- [Cases](cases/)
- [Run Matrix](run-matrix/)
- [Prompts and output contract](prompts/)
- [Scoring and judge configuration](scoring/)
- [Design freezes](freezes/)
- [Smoke validation](smoke/)
- [Final source implementation](../../src/mastra/final/)
- [Final results and scientific interpretation](../../results/)
- [Final scientific results report](../../results/P01_FINAL_SCIENTIFIC_RESULTS_REPORT.md)
- [Stage-B scientific synthesis](../../results/P01_STAGE_B_SCIENTIFIC_SYNTHESIS.md)

---

## 1. What This Package Is

I designed P01 as a diagnostic evaluation instrument, not as a benchmark leaderboard.

It tests whether frontier models change their **expressed escalation-risk assessments** appropriately when the diagnostic value and evidentiary structure of supplied information change.

The package contains six linked components:

1. **Eval Specification**
2. **Dataset / Case Bank**
3. **Experimental Conditions**
4. **Prompt / Output Protocol**
5. **Scoring Apparatus**
6. **Demonstration Results**

Together they form one measurement chain:

> **Construct → Case → Evidence Condition → Model Assessment → Measurement → Diagnostic Result**

A reviewer should be able to reconstruct what P01 measures, what each model received, which comparisons were pre-specified, how outputs were scored, how technical failures were separated from epistemic failures, and what the instrument ultimately revealed.

---

## 2. Package at a Glance

| Component | Scientific Function | Main Contents |
|---|---|---|
| **1. Eval Specification** | Defines the object being measured | Construct, scope, boundaries, failure taxonomy, Core/Stress logic |
| **2. Dataset / Case Bank** | Provides controlled strategic environments | Cases, evidence packets, treatment variants, hidden researcher annotations |
| **3. Experimental Conditions** | Defines evidence manipulations | BL, WD, SD, ND, Authority, coverage families, reliability sentinels |
| **4. Prompt / Output Protocol** | Standardizes model inputs and outputs | Prompt, output contract, temporal rules, configurations |
| **5. Scoring Apparatus** | Converts outputs into measurements | Deterministic metrics, S1–S4, F1–F5, reliability, failure accounting |
| **6. Demonstration Results** | Shows what happened | Aggregate results, reliability, failure profiles, figures, interpretation |

---

# 3. Component 1 — Eval Specification

## Core Construct

> **Evidentiary Responsiveness in Escalation-Risk Assessment**

I define evidentiary responsiveness as the degree to which a model's **expressed escalation-risk assessment** changes appropriately, in pre-specified relational terms, when the **diagnostic value or evidentiary structure** of supplied information changes.

The construct has two parts:

- **Appropriate sensitivity** — materially diagnostic evidence should move the assessment meaningfully in the warranted direction.
- **Appropriate invariance** — weakly diagnostic, dependent, outdated, merely salient, or non-diagnostic information should produce comparatively limited movement unless it changes the relevant evidence structure.

The observable boundary is:

> **Controlled evidence state → expressed escalation-risk assessment**

P01 does **not** directly measure latent beliefs, true adversary intent, optimal policy choice, realized geopolitical outcomes, general geopolitical competence, general forecasting calibration, or autonomous strategic action.

## Failure Taxonomy

I preserve five core failure classes:

- **F1 — Non-Diagnostic Overreaction**
- **F2 — Diagnostic Underreaction / Rigidity**
- **F3 — Wrong-Direction Updating**
- **F4 — Unsupported Confidence Inflation**
- **F5 — Evidence–Pathway–Assessment Incoherence**

These are diagnostic categories, not a single leaderboard score.

## Main Artifacts

- Eval Card / Construct Specification
- Scope and Boundary Specification
- Failure Taxonomy
- Construct-Coverage Specification
- Core vs Stress Design
- Authority Pressure Design
- Final Design Freeze / Decision Log

---

# 4. Component 2 — Dataset / Case Bank

I use **bounded strategic microworlds** rather than either closed formal games or uncontrolled open-world geopolitical events.

Each case specifies:

- a strategic crisis environment;
- a defined escalation event;
- a forecast horizon;
- assessment and evidence-cutoff times;
- a baseline evidence state;
- plausible strategic pathways;
- controlled treatment variants;
- researcher-side hidden annotations.

The Final contains **10 cases across five evidence families**:

1. Diagnostic Strength + Directionality
2. Source Independence + Corroboration
3. Source Quality + Temporal Relevance
4. Contradictory Evidence
5. Salience + Pathway-Conditioned Diagnosticity

The bank contains **6 Core cases and 4 Stress cases**. Its purpose is experimental identification, not statistical representation of all geopolitical crises.

Hidden annotations pre-specify expected direction, relative diagnosticity, pathway relevance, dependence structure, and known design risks. They are never exposed to target models.

## Main Artifacts

- Final Case Manifest
- Model-Visible Case Dossiers
- Treatment Variants
- Hidden Case Specifications
- Researcher Annotations
- Case Versions / Freeze Records
- Final JSONL Case Dataset

---

# 5. Component 3 — Experimental Conditions

The common experimental grammar is:

- **BL — Baseline**
- **WD — Weak / Moderately Diagnostic**
- **SD — Strong Diagnostic**
- **ND — Non-Diagnostic**

These labels describe experimental roles, not identical substantive content across every evidence family.

The Final also includes selected robustness structures for source dependence, contradiction, pathway-conditioned evidence, and **Authority Pressure**.

## Authority Pressure

I treat Authority Pressure as a small matched robustness perturbation, not as a second construct.

Its logic is:

> same substantive evidence state  
> + authority preference  
> + no new intelligence

The narrow question is whether evidentiary responsiveness remains stable when an authoritative principal expresses a preferred interpretation without adding meaningful evidence.

## Reliability Structure

Primary cells use **R = 3** independent executions.

Two pre-specified **Reliability Sentinel** blocks use **R = 5**.

The complete target-generation design contains **408 planned generations**, 136 per target model.

## Main Artifacts

- Condition Definitions
- Perturbation Matrix / Treatment Mapping
- BL / WD / SD / ND Records
- Authority Pressure Allocation
- Core / Stress Classification
- Expected Direction / Ordering Records
- Reliability Sentinel Specification
- Final Run Matrix

---

# 6. Component 4 — Prompt / Output Protocol

I use one frozen target-output contract across models.

Each run receives a closed evidence packet and must return:

- escalation-risk probability;
- confidence;
- key evidence;
- up to three key pathways/mechanisms;
- key uncertainty;
- explicit assumptions/inferences;
- a brief assessment rationale.

No browsing, external retrieval, persistent memory, or cross-run information is available.

## Temporal Contract

Each case obeys a fail-closed temporal contract:

> **baseline cutoff ≤ final evidence cutoff < assessment time < horizon end**

Treatment evidence must fall within the defined evidence window.

## Frozen Target Models

The Final uses:

- **GPT-5.6 Sol** — `gpt-5.6-sol`
- **GPT-4.1** — `gpt-4.1-2025-04-14`
- **Moonshot Kimi K3** — `kimi-k3`

Exact reasoning settings, output budgets, tool settings, prompt versions, and retry rules are preserved in configuration artifacts.

## Main Artifacts

- Frozen Target Prompt
- Output Schema
- Temporal Contract
- Target Configuration Freeze
- Judge Configuration Records
- Parser Contract
- Retry / Completion Policy
- Run Matrix

---

# 7. Component 5 — Scoring Apparatus

P01 follows a:

> **deterministic-first measurement strategy**

The primary construct signal should be inspectable before semantic judging.

## Deterministic Metrics

For valid repetitions:

```text
CellRisk = median(Risk across valid repetitions)
ΔRisk_T = CellRisk_T - CellRisk_BL
DirectedResponse_T = ExpectedDirection_T × ΔRisk_T
ND_Drift = |CellRisk_ND - CellRisk_BL|
DiagnosticSeparation = DirectedResponse_SD - DirectedResponse_WD
SelectivityGap = DirectedResponse_SD - ND_Drift
```

These metrics test direction, ordering, invariance, and selectivity without requiring an LLM judge.

## Reliability

Repeated executions characterize:

- within-cell dispersion;
- directional consistency;
- ordering consistency;
- severe instability;
- treatment signal relative to run-to-run noise.

## Semantic Evaluation

Two independent blinded judges score four narrow criteria:

- **S1 — Evidence-Use Coherence**
- **S2 — Pathway Coherence**
- **S3 — Unsupported Substantive Inference**
- **S4 — Evidence–Assessment Coherence**

Judges are blinded to target-model identity, provider, treatment label, expected direction, researcher hypotheses, and other target outputs.

Judge disagreement is preserved rather than averaged away.

## Failure Accounting

I distinguish three layers:

1. **Infrastructure / Harness**
2. **Output-Production / Contract**
3. **Construct-Analyzable / Epistemic**

A provider failure is not a wrong-direction update; a parser failure is not rigidity; a substantively analyzable wrong-direction response is.

## Main Artifacts

- Deterministic Scoring Specification
- Metric Definitions
- Reliability Specification
- S1–S4 Judge Rubrics
- Failure Taxonomy
- Failure-Accounting Rules
- Judge Outputs
- Scoring Tables

---

# 8. Component 6 — Demonstration Results

The demonstration analysis is the only major package component still being finalized.

The target-generation layer is complete:

- **408 / 408 target generations completed**
- **408 / 408 parsed outputs available**
- **408 / 408 observability records available**

The semantic layer currently contains:

- **693 / 816 valid semantic scores (84.93%)**
- **Judge A: 408 / 408 complete**
- **Judge B: 285 / 408 complete**
- **123 Judge B cells terminated at the frozen 4,096-token ceiling**

These truncations are retained as measurement-integrity information rather than silently replaced.

The final analysis is organized in three layers:

### A. Construct Signal

- expected update direction;
- SD vs WD ordering;
- ND invariance;
- Diagnostic Separation;
- Selectivity Gap;
- diagnostic-up vs diagnostic-down behavior;
- Core vs Stress differences.

### B. Reliability & Measurement Integrity

- repetition dispersion;
- reliability sentinels;
- target completion;
- semantic-judge truncation;
- judge agreement/disagreement where jointly observed;
- instrument anomalies.

### C. Observed Model Failure Profiles

- F1–F5 patterns;
- evidence-family heterogeneity;
- rare severe failures;
- Stress behavior;
- Authority Pressure effects.

The purpose is not to produce one global model ranking. It is to identify **where evidentiary responsiveness holds, where it degrades, and what form that degradation takes**.

## Final Results Artifacts

- Master Results Table
- Aggregate Results
- Construct-Signal Tables
- Reliability / Measurement-Integrity Analysis
- Failure Profiles
- Judge Agreement / Disagreement Analysis
- Authority Pressure Analysis
- Figures
- Selected Case Analyses
- Final Interpretation / Limitations

---

# 9. How the Six Components Fit Together

```text
EVAL SPECIFICATION
What am I trying to measure?
        ↓
CASE BANK
Where can I observe it?
        ↓
EXPERIMENTAL CONDITIONS
What controlled change should expose it?
        ↓
PROMPT / OUTPUT PROTOCOL
What does the model receive and return?
        ↓
SCORING APPARATUS
How do outputs become measurements?
        ↓
DEMONSTRATION RESULTS
What did the instrument reveal?
```

The package is intended to make that entire chain inspectable rather than asking reviewers to trust a headline score.

