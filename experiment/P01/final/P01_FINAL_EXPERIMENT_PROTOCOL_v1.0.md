# P01 Final Experiment Protocol

**Protocol ID:** `P01_FINAL_PROTOCOL_V1.0`  
**Status:** BLOCK B COMPLETE — BLOCK C CASE CONSTRUCTION PENDING

This is the authoritative P01 Final protocol. Historical Alpha documents, Run Matrix, RAW, parsed outputs, and traces remain immutable.

## Controlled artifacts

- Construct and portfolio: `construct_card_v1.0.md`
- Failure taxonomy: `failure_taxonomy_v1.0.md`
- Measurement, reliability, statuses, and semantic criteria: `scoring_spec_v1.0.md`
- Target prompt/output contract: `prompt_v1.0.md`
- Final case boundary: `case_template_v1.0.json`
- Target architecture and reference geometry: `run_config_schema_v1.0.json`
- Judge identities/rubrics/blinding/Langfuse scope: `judge_config_v1.0.json`
- Frozen calibration fixtures: `calibration_fixtures_v1.0.jsonl`
- Langfuse resource receipt: `langfuse_resources_v1.0.json`

## Freeze rules

Block C must construct exactly 10 synthetic cases in the pre-allocated five-family, 6-Core/4-Stress architecture. It must freeze diagnosticity, dependence, pathways, timing, confounds, and expected relational behavior before target outputs. Default grammar is `BL/WD/SD/ND` where appropriate.

Primary cells use three independent repetitions. Exactly two sentinel blocks will receive two additional repetitions after their identities freeze. Two future cases receive Authority robustness arms `BL+AUTH` and `SD+AUTH`; Authority adds no substantive evidence.

Exactly three targets are permitted: `gpt-5.6-sol`, `gpt-4.1-2025-04-14`, and `kimi-k3`. The future Final Run Matrix, never `.env`, is authoritative. No Kimi model override exists in `.env`.

The reference geometry is 360 base + 36 Authority + 12 sentinel = **408 target generations**. At two judges per analyzable output, maximum production judge workload is **816 executions**. This count freezes only after Block C.

The renderer consumes only `model_visible`; `researcher_hidden` is denied. Future Final traces must carry `experiment_phase=P01_FINAL`, `protocol_version=P01_FINAL_PROTOCOL_V1.0`, and `p01_final_rule_scope=P01_FINAL_ONLY`. Langfuse rules remain disabled through calibration and integrated smoke.

## Remaining gate

Block C must create and independently review concrete cases, choose the two Authority cases and two reliability sentinel blocks, then produce the exact immutable Final Run Matrix. No target or paid judge execution is authorized by this protocol alone.
