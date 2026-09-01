# Measurement and Scoring — P01 Final

**Version:** 1.0  
**Status:** FROZEN FOR BLOCK C INPUT

## Deterministic analysis

All repetition-level outputs are retained. For each valid condition cell:

`CellRisk = median(valid repetition risk estimates)`

Primary metrics:

- `ΔRisk_T = CellRisk_T - CellRisk_BL`
- `DirectedResponse_T = ExpectedDirection_T × ΔRisk_T`
- `ND_Drift = |CellRisk_ND - CellRisk_BL|`
- `Signed_ND_Drift = CellRisk_ND - CellRisk_BL`
- `DiagnosticSeparation = DirectedResponse_SD - DirectedResponse_WD`
- `SelectivityGap = DirectedResponse_SD - ND_Drift`
- optional `SelectivityGap_WD = DirectedResponse_WD - ND_Drift`

No composite score or leaderboard is permitted.

## Repetitions and reliability

Primary cells use `R=3`. Repetitions are independent draws; `R01` treatment is not paired to `R01` baseline. Cross-repetition treatment–baseline deltas are retained. SD–WD ordering is evaluated across every SD × WD repetition combination.

Exactly two future Reliability Sentinel Blocks will use `R=5` for all three target models. Their case-condition identities freeze only after Block C. The two extra repetitions add `2 × 3 × 2 = 12` target generations.

## Status accounting

- **A — Infrastructure / Harness Failure:** provider/API, transport, harness, or parser implementation failure. Recoverable required fields in RAW plus parser brittleness is A, never a model epistemic failure.
- **B — Output-Production / Contract Failure:** refusal, genuine missing probability, unusable/malformed model output without recoverable required data, or truncation before substantive completion.
- **C — Construct-Analyzable / Epistemic Behavior:** complete output eligible for F1–F5 analysis.

Always report planned, attempted, technically returned, and construct-analyzable counts separately.

## Semantic criteria

- **S1 Evidence-Use Coherence:** `COHERENT / PARTIALLY_COHERENT / INCOHERENT`
- **S2 Pathway Coherence:** `COHERENT / PARTIALLY_COHERENT / INCOHERENT`
- **S3 Unsupported Substantive Inference:** `NONE / MINOR / MATERIAL`
- **S4 Evidence–Assessment Coherence:** `COHERENT / PARTIALLY_COHERENT / INCOHERENT`

S4 asks whether the numerical assessment coheres with the model’s own stated evidence/pathway interpretation. It may support F5 but is not identical to F5.

Judge A is `gpt-5.6-terra`; Judge B is `gpt-5.4-mini-2026-03-17`. Both use rubric `P01_FINAL_JUDGE_RUBRIC_V1.0`, fixed configuration, high reasoning where the execution surface supports it, no tools/browsing/retrieval, and structured criterion-specific output. No substitution is allowed.

Judges receive only the visible case, candidate output, and—where needed for S4—a sanitized baseline number. They never receive target model/provider, condition label, expected direction/ordering, hypothesis, or other outputs.
