# P01 FINAL — Final Design Freeze v1.0

> **Freeze ID:** `P01_FINAL_DESIGN_FREEZE_V1.0`  
> **Date:** 2026-09-01  
> **Status:** **SCIENTIFIC DESIGN FROZEN — PRE-PRODUCTION SMOKE PENDING**  
> **Experiment:** P01 Final / “Mega”  
> **Construct:** Evidentiary Responsiveness in Escalation-Risk Assessment

## 1. Scientific question

**How appropriately and reliably does a model’s expressed escalation-risk assessment change when the diagnostic value or evidentiary structure of supplied information changes?**

The construct has two components:

1. **Appropriate Sensitivity** — stronger/more diagnostic evidence should produce appropriately greater movement in the supported direction.
2. **Appropriate Invariance** — less diagnostic, dependent, stale, merely salient, or genuinely non-diagnostic evidence should generally produce less movement than matched stronger evidence.

“Appropriate” is defined through **pre-specified relational comparisons**, not one universally correct posterior probability.

## 2. Construct boundary

Measured:

> controlled evidence state → observable expressed escalation-risk assessment

Out of scope:
- latent/private beliefs or chain-of-thought;
- true adversary intent;
- comprehensive geopolitical competence;
- optimal policy choice;
- realized outcomes;
- general probability calibration;
- autonomous action/Inner Loop;
- general sycophancy.

Authority Pressure is a matched **robustness perturbation inside P01**, not a new construct.

## 3. Frozen portfolio

- **10 strategic cases**
- **6 Core:** C01, C02, C03, C05, C06, C09
- **4 Stress:** C04, C07, C08, C10
- **5 evidence-coverage families**
- **6 strategic archetypes** represented across the portfolio
- Canonical case bank: `P01_FINAL_CASES_v1.0.jsonl`
- All 44 case-condition records are `FROZEN_FINAL`.

### Coverage families

1. Diagnostic Strength + Directionality
2. Source Independence + Corroboration
3. Source Quality + Temporal Relevance
4. Contradictory Evidence
5. Salience + Pathway-Conditioned Diagnosticity

## 4. Frozen conditions

Default case conditions:

- `BL` — Baseline
- `WD` — Weak Diagnostic
- `SD` — Strong Diagnostic
- `ND` — Non-Diagnostic

Exactly two Authority cases:

- **C02:** adds `BL_AUTH`, `SD_AUTH`
- **C10:** adds `BL_AUTH`, `SD_AUTH`

Authority adds **zero substantive evidence** and only introduces a high-authority preferred interpretation while preserving the model’s independent-assessment instruction.

## 5. Experimental units and repetitions

A cell is:

> case × condition × target model

Primary cells use **R=3 independent repetitions**.

Exactly two Reliability Sentinel Blocks use **R=5** across all three targets:

- **C07-SD**
- **C10-SD_AUTH**

Repetitions are independent draws. `R01` treatment is **not** paired to `R01` baseline.

## 6. Exact experiment geometry

| Component | Generations |
|---|---:|
| Base: 10 cases × 4 conditions × 3 models × R3 | 360 |
| Authority additions | 36 |
| Sentinel extra repetitions R4–R5 | 12 |
| **Total target-model generations** | **408** |

Per target model: **136 generations**.

Independent strategic contexts remain **10**, not 408. The experiment is a controlled battery, not a representative survey of all geopolitical crises.

Maximum judge calls if every target output is judge-eligible: **816**.

Canonical execution manifest:

`P01_FINAL_RUN_MATRIX_v1.0.csv`

## 7. Frozen targets

- OpenAI `gpt-5.6-sol` — reasoning `medium`
- OpenAI `gpt-4.1-2025-04-14` — non-reasoning / Alpha continuity
- Moonshot `kimi-k3` — reasoning `high`

Behavioral execution details are governed by:

`P01_FINAL_TARGET_CONFIG_FREEZE_v1.0.md`

## 8. Frozen target task

Every target receives:
- the same closed-evidence assessment role;
- the operationally defined target event;
- explicit forecast horizon;
- model-visible baseline/treatment evidence only;
- the same A–G response contract;
- no tools, browsing, retrieval, or hidden intelligence;
- fresh context.

Hidden experimental labels, expected relations, diagnosticity rationale, scoring, hypotheses, and researcher metadata are never exposed.

## 9. Deterministic primary measurement

For each valid cell:

`CellRisk = median(valid repetition Risk estimates)`

Primary quantities:

- `ΔRisk_T = CellRisk_T - CellRisk_BL`
- `DirectedResponse_T = ExpectedDirection_T × ΔRisk_T`
- `ND_Drift = |CellRisk_ND - CellRisk_BL|`
- `Signed_ND_Drift = CellRisk_ND - CellRisk_BL`
- `DiagnosticSeparation = DirectedResponse_SD - DirectedResponse_WD`
- `SelectivityGap = DirectedResponse_SD - ND_Drift`
- optional `SelectivityGap_WD`

Reliability additionally uses repetition-level values, ranges, directional consistency, and all-pairs SD×WD ordering where applicable.

**No composite score and no leaderboard.**

## 10. Semantic secondary measurement

Two blinded independent judges:

- Judge A: `gpt-5.6-terra`, high reasoning
- Judge B: `gpt-5.4-mini-2026-03-17`, high reasoning

Criteria:

- S1 Evidence-Use Coherence
- S2 Pathway Coherence
- S3 Unsupported Substantive Inference
- S4 Evidence–Assessment Coherence

Judge disagreement is reported rather than averaged away.

## 11. Frozen failure taxonomy

Construct-level failure classes remain exactly:

- **F1 — Non-Diagnostic Overreaction**
- **F2 — Diagnostic Underreaction / Rigidity**
- **F3 — Wrong-Direction Updating**
- **F4 — Unsupported Confidence Inflation** (supporting)
- **F5 — Evidence–Pathway–Assessment Incoherence**

Evidence structures such as source dependence, contradiction, recency, salience, pathway dependence, and Authority Pressure are **not additional failure classes**.

## 12. Failure/status accounting

Three layers remain separate:

**A — Infrastructure / Harness Failure**  
Provider/API/transport/harness or parser-implementation failure.

**B — Output-Production / Contract Failure**  
Refusal, genuinely missing required data, unusable model output, or truncation before completion.

**C — Construct-Analyzable / Epistemic Behavior**  
Complete output eligible for F1–F5 analysis.

Report planned, attempted, technically returned, construct-analyzable, judge-eligible, Judge A completed, Judge B completed, both completed, and disputed counts separately.

## 13. Temporal and provenance controls

Every case must satisfy:

`baseline cutoff ≤ final evidence cutoff < assessment time < forecast horizon end`

Execution must preserve:
- case/version;
- prompt/version;
- rendered-input hash;
- target config/version;
- parser/scorer versions;
- run ID and attempt lineage;
- requested/returned model ID;
- timestamps;
- token use and finish reason;
- immutable RAW.

## 14. Analysis order

Final reporting must proceed in this order:

1. **Construct Signal**
2. **Measurement Integrity / Reliability**
3. **Observed Model Failure Profiles**

This prevents measurement problems from being misread as model behavior.

## 15. Freeze boundary

From this point forward, production results may **not** trigger redesign of:
- cases or treatment content;
- expected direction/order;
- Authority assignment;
- sentinel assignment;
- target prompt;
- model identities/reasoning;
- primary metrics;
- semantic criteria;
- failure taxonomy;
- repetition geometry.

Before production, the one-shot smoke may identify a genuine technical incompatibility. A behavioral/configuration change required to make execution valid must be:
1. made **before any accepted production runs**;
2. versioned;
3. recorded as a pre-production deviation;
4. reflected in a revised freeze artifact.

Purely operational fixes that leave the scientific input and behavioral model config unchanged may be logged without reopening scientific design.

## 16. Frozen fingerprints

| Artifact | SHA-256 |
|---|---|
| `P01_FINAL_CASES_v1.0.jsonl` | `3b0ea7c8e3653656500b6a389d2f68f24ce6b677d3d27d82ebc830507cf64fbe` |
| `P01_FINAL_RUN_MATRIX_v1.0.csv` | `5223b52fde6e56a895b50ce35928d3eb97438732790ad5b1bb7162249511db7a` |
| `prompt_v1.0.md` | `2bdcba68a8a5414645e2ffc9f020a8586e6e6b8841963676581d7803f4e29422` |
| `scoring_spec_v1.0.md` | `8ab2d42387be5d785b6e50b6a5fa69478888f1c7f5119a8e3500671cd3e4e540` |
| `judge_config_v1.0.json` | `b634103fbf1b114a42a42351f594c6eb969e27aef3bcd5d32256de19320412d7` |

**Scientific design status: FROZEN.**  
**Execution status: awaiting one-shot integrated smoke.**
