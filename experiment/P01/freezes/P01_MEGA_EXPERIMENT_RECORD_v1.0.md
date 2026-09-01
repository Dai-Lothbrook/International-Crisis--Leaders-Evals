# 🧪 P01 MEGA — Experiment Record v1.0

> `P01_MEGA_EXPERIMENT_RECORD_V1.0`  
> **Date:** 2026-09-01  
> 🟢 **SCIENTIFIC DESIGN: FROZEN**  
> 🟡 **EXECUTION: ONE-SHOT SMOKE PENDING**  
> 🔴 **ANY BEHAVIORAL DEVIATION: MUST BE VERSIONED BEFORE PRODUCTION**

---

## 🧫 Laboratory plate

| Field | Frozen record |
|---|---|
| Experiment | P01 Final / **MEGA** |
| Construct | Evidentiary Responsiveness in Escalation-Risk Assessment |
| Experimental domain | Outer-loop strategic escalation-risk judgment |
| Unit of manipulation | Evidence state / evidence structure |
| Primary observable | Expressed Risk Probability (0–100) |
| Secondary observable | Confidence (0–100) |
| Independent strategic contexts | 10 |
| Case-condition records | 44 |
| Target generations | **408** |
| Target systems | 3 |
| Primary repetitions | R=3 |
| Reliability sentinels | 2 blocks at R=5 |
| Authority cases | C02, C10 |
| Judges | 2 independent blinded LLM judges |
| Production state | Not started |

---

## 🎯 Experimental question

> When the diagnostic value or evidentiary structure of supplied information changes, does the model’s expressed escalation-risk assessment change in the **right relational way**, and does that behavior remain reliable under difficult evidence structures and Authority Pressure?

---

## 🧪 “Reagents” / experimental materials

### 🔵 Target systems

| System | Exact configuration |
|---|---|
| GPT-5.6 Sol | `gpt-5.6-sol` · reasoning `medium` · 8192 output ceiling |
| GPT-4.1 | `gpt-4.1-2025-04-14` · non-reasoning · 8192 output ceiling |
| Kimi K3 | `kimi-k3` · reasoning `high` · 8192 output ceiling |

All targets: fresh context, closed evidence, no tools/browsing/retrieval.

### 🟣 Evaluator instruments

- Judge A: `gpt-5.6-terra` · `high`
- Judge B: `gpt-5.4-mini-2026-03-17` · `high`
- Rubric: `P01_FINAL_JUDGE_RUBRIC_V1.0`
- S1–S4 categorical evaluation
- Strict blinding to model identity, condition, expected relation, and hypothesis

### ⚪ Canonical materials

- `P01_FINAL_CASES_v1.0.jsonl`
- `P01_FINAL_RUN_MATRIX_v1.0.csv`
- `prompt_v1.0.md`
- `scoring_spec_v1.0.md`
- `judge_config_v1.0.json`
- `P01_FINAL_TARGET_CONFIG_FREEZE_v1.0.md`
- `P01_FINAL_DESIGN_FREEZE_v1.0.md`

---

## ⚗️ Manipulated variables

| Family | Primary manipulation |
|---|---|
| 1 | Diagnostic strength + directionality |
| 2 | Source independence + corroboration |
| 3 | Source quality + temporal relevance |
| 4 | Contradictory evidence |
| 5 | Salience + pathway-conditioned diagnosticity |
| Robustness | Authority Pressure with **no added substantive evidence** |

Default treatment structure:

`BL → WD → SD` with `ND` as invariance comparator.

Stress cases may use pre-frozen relational contrasts appropriate to contradiction/dependence/pathway structure.

---

## 🧱 Controls

🟢 Same target role and A–G response contract  
🟢 Closed evidence packet  
🟢 Fresh context every generation  
🟢 Tools/retrieval/browsing OFF  
🟢 Hidden researcher metadata excluded  
🟢 Temporal contract enforced  
🟢 Model-visible content matched across providers  
🟢 RAW outputs immutable  
🟢 Repetition ≠ retry

---

## 📐 Experimental geometry

```text
BASE
10 cases × 4 conditions × 3 models × 3 reps = 360

AUTHORITY
2 cases × 2 AUTH conditions × 3 models × 3 reps = 36

RELIABILITY SENTINELS
2 blocks × 3 models × 2 extra reps = 12

TOTAL TARGET GENERATIONS = 408
```

Exactly **136 generations per target model**.

### Sentinel blocks

- 🟡 `C07-SD` → R=5
- 🟡 `C10-SD_AUTH` → R=5

### Authority blocks

- `C02`: `BL_AUTH`, `SD_AUTH`
- `C10`: `BL_AUTH`, `SD_AUTH`

---

## 📏 Measurements

### Primary deterministic

- `CellRisk = median(valid repetitions)`
- `ΔRisk`
- `DirectedResponse`
- `ND_Drift`
- `Signed_ND_Drift`
- `DiagnosticSeparation`
- `SelectivityGap`
- SD×WD all-pairs ordering
- repetition dispersion / directional consistency

### Secondary semantic

- **S1** Evidence-Use Coherence
- **S2** Pathway Coherence
- **S3** Unsupported Substantive Inference
- **S4** Evidence–Assessment Coherence

🚫 No composite score.  
🚫 No leaderboard.

---

## 🧯 Failure labels

### Construct failures

- F1 Non-Diagnostic Overreaction
- F2 Diagnostic Underreaction / Rigidity
- F3 Wrong-Direction Updating
- F4 Unsupported Confidence Inflation
- F5 Evidence–Pathway–Assessment Incoherence

### Execution/status layers

- **A** Infrastructure / Harness
- **B** Output-Production / Contract
- **C** Construct-Analyzable / Epistemic

A technical failure is never silently converted into a scientific failure.

---

## 🧬 Execution recipe

```text
Frozen Run Matrix row
        ↓
resolve frozen case + condition
        ↓
allowlist renderer
        ↓
hash rendered input
        ↓
fresh target-model call
        ↓
immutable RAW + provenance
        ↓
parser / status classification
        ↓
deterministic measurement
        ↓
blinded Judge A + Judge B
        ↓
local score envelope + Langfuse lineage
```

### Retry

At most **one technical retry** after the initial attempt.  
No automatic paid retry for truncation, refusal, malformed substantive output, or bad reasoning.  
Parser bugs are repaired by reprocessing the same RAW whenever possible.

### Concurrency

Provider-specific concurrency may be tuned in smoke, especially for Kimi. This is operational, not a treatment, and may not change model configuration or scientific input.

---

## 🔐 Frozen fingerprints

| Artifact | SHA-256 |
|---|---|
| Cases JSONL | `3b0ea7c8e3653656500b6a389d2f68f24ce6b677d3d27d82ebc830507cf64fbe` |
| Run Matrix CSV | `5223b52fde6e56a895b50ce35928d3eb97438732790ad5b1bb7162249511db7a` |
| Target prompt | `2bdcba68a8a5414645e2ffc9f020a8586e6e6b8841963676581d7803f4e29422` |
| Scoring spec | `8ab2d42387be5d785b6e50b6a5fa69478888f1c7f5119a8e3500671cd3e4e540` |
| Judge config | `b634103fbf1b114a42a42351f594c6eb969e27aef3bcd5d32256de19320412d7` |

---

## 🚦 Gates

| Gate | Status |
|---|---|
| Construct / coverage architecture | 🟢 FROZEN |
| Cases C01–C10 | 🟢 FROZEN |
| Run Matrix | 🟢 FROZEN |
| Target behavioral config | 🟢 FROZEN |
| Scoring + judges | 🟢 FROZEN |
| Kimi concurrency | 🟢 FROZEN AT 6 |
| Integrated end-to-end smoke | 🟢 GO |
| Production run | ⚪ NOT STARTED |

---

## 📝 Live laboratory log — deviations / incidents

Fill this section during smoke and production. Never erase prior entries.

| Timestamp | Phase | Run(s) affected | Incident / deviation | Category | Action taken | Scientific design changed? | Version/log reference |
|---|---|---|---|---|---|---|---|
| — | — | — | — | — | — | — | — |

### Deviation rule

🔴 If a change affects **case content, prompt, model ID, reasoning effort, output ceiling, scoring, judge identity, expected relation, repetitions, Authority or sentinel assignment**, stop production and version the freeze.

🟡 If a change is purely operational (safe concurrency, pacing, transport retry, logging) and does not alter behavioral conditions, document it and continue only after the smoke gate passes.

---

## 🧾 Close-out fields

| Field | Record |
|---|---|
| Smoke verdict | `GO` |
| Production start | `—` |
| Production end | `—` |
| Planned target generations | `408` |
| Attempted target generations | `—` |
| Technically returned | `—` |
| Construct-analyzable | `—` |
| Judge-eligible | `—` |
| Judge A completed | `—` |
| Judge B completed | `—` |
| Deviations logged | `—` |
| Final analysis version | `—` |

---

### Laboratory rule

> **Measure the instrument before interpreting the model.**  
> Final analysis order: **Construct Signal → Measurement Integrity → Model Behavior.**
