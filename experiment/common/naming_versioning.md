# Naming & Versioning Protocol

**Project:** Strategic AI Evaluation — Alpha Probes  
**Document:** Naming & Versioning Protocol  
**Version:** v0.2  
**Status:** FROZEN FOR ALPHA

---

## 1. Purpose

This protocol ensures that cases, prompts, experimental conditions, model runs, scoring outputs, and revisions remain traceable and reproducible.

No artifact that has been used in an experimental run may be silently overwritten.

---

## 2. Core Rule

Every versioned experimental artifact receives:

> **TYPE + IDENTIFIER + VERSION**

Example:

`VISIBLE_P01_003_v01`

Meaning:

- `VISIBLE` = artifact type
- `P01` = Probe 1
- `003` = case number
- `v01` = artifact version

A stable logical identifier links related artifacts even when their artifact versions differ.

---

## 3. Probe Codes

```text
P01 = Evidentiary Responsiveness Probe
P02 = Information Seeking Probe
P03 = Reserved / inactive unless explicitly opened
```

---

## 4. Case IDs and Linked Artifacts

Stable logical case ID:

`CASE_P01_001`

Model-facing visible case:

`VISIBLE_P01_001_v01`

Researcher-side hidden specification:

`HIDDEN_P01_001_v01`

The Visible Case and Hidden Case Specification MUST share the same **probe code and case number**, but they may have different artifact versions if only one component changes.

Example:

```text
CASE_P01_004
VISIBLE_P01_004_v02
HIDDEN_P01_004_v01
```

The Design Decision Log must record any version mismatch and its reason.

---

## 5. Condition Codes

Probe 1 Alpha:

```text
BL = Baseline
SD = Strong Diagnostic
WD = Weak / Moderately Diagnostic
ND = Salient Non-Diagnostic
AU = Authority Pressure, only if explicitly activated as a separate orthogonal manipulation
```

Visible condition variant example:

`VISIBLE_P01_003_SD_v01`

Authority must not be combined with diagnostic treatment in the primary causal comparison unless an interaction is explicitly designed.

Probe 2 condition codes are defined in its probe-specific variant specification rather than assumed here.

---

## 6. Prompt IDs

Shared/core prompt:

`PROMPT_P01_CORE_v01`

Condition-specific prompt delta, only if needed:

`PROMPT_P01_SD_v01`

Judge prompts:

```text
JUDGE_PROMPT_P01_A_v01
JUDGE_PROMPT_P01_B_v01
```

---

## 7. Model IDs

Each evaluated model receives a stable frozen alias:

```text
MODEL_A
MODEL_B
MODEL_C
```

The separate Model Config file maps each alias to the exact runtime configuration, including:

- provider;
- exact model/version;
- date accessed;
- temperature;
- reasoning/inference settings;
- tool access;
- system prompt;
- API, wrapper, or platform;
- other relevant runtime configuration.

Model aliases MUST NOT substitute for exact configuration metadata in the run manifest.

---

## 8. Run IDs

Run ID format:

`RUN_[PROBE]_[CASE]_[CONDITION]_[MODEL]_[REPETITION]_[RUNSPEC]`

Example:

`RUN_P01_003_SD_MODEL_A_R02_RS01`

Meaning:

- Probe 1
- Case 003
- Strong Diagnostic condition
- Model A
- Repetition 2
- Run-specification version 1

Each run MUST be linked in the Run Matrix or run manifest to the exact versions of:

- visible case;
- hidden case specification;
- prompt;
- output schema;
- model configuration;
- scoring specification applicable at execution time.

---

## 9. Repetition Codes

```text
R01
R02
R03
...
```

Repetitions refer to independent executions under the same frozen experimental configuration.

---

## 10. Scoring IDs

Deterministic scoring:

`SCORE_DET_RUN_P01_003_SD_MODEL_A_R02_v01`

Judge A:

`SCORE_JA_RUN_P01_003_SD_MODEL_A_R02_v01`

Judge B:

`SCORE_JB_RUN_P01_003_SD_MODEL_A_R02_v01`

Human adjudication:

`SCORE_HUMAN_RUN_P01_003_SD_MODEL_A_R02_v01`

Scoring version refers to the scoring artifact/version, not to a modification of the raw model output.

---

## 11. Artifact Lifecycle Status

Major design artifacts may use:

```text
DRAFT
UNDER_REVIEW
FROZEN_FOR_ALPHA
REVISED_AFTER_PILOT
DEPRECATED
```

Once an artifact has produced target-model outputs, edits require a new version.

Do NOT overwrite:

`PROMPT_P01_CORE_v01`

Create:

`PROMPT_P01_CORE_v02`

---

## 12. Freeze Rule

Before target-model execution, the following must be frozen for the relevant run:

- visible case;
- hidden case specification;
- diagnosticity rationale where applicable;
- condition assignment;
- prompt;
- output schema;
- model configuration;
- primary deterministic scoring logic;
- semantic scoring rubric where applicable.

Changes after target-model outputs are viewed MUST be documented in the Design Decision Log and MUST NOT be retroactively applied to prior runs without explicit re-analysis or rerun labeling.

---

## 13. Decision Log

Every substantive change should record:

```text
Date:
Artifact:
Old Version:
New Version:
Reason:
Trigger:
Was target-model output already observed? YES / NO
Impact on previous runs:
Action required:
```

This is especially important for changes to:

- construct definition;
- diagnosticity rationale;
- failure indicators;
- perturbation design;
- prompt;
- output schema;
- judge rubric;
- scoring logic.

---

## 14. Raw Output Preservation

Raw target-model outputs are immutable.

Never edit an original raw response.

If parsing, normalization, or annotation is needed, create a derived artifact while preserving the original.

Example:

```text
RAW_RUN_P01_003_SD_MODEL_A_R02.json
PARSED_RUN_P01_003_SD_MODEL_A_R02_v01.json
```

If a parse is corrected, version the parsed artifact; do not alter the raw output.

---

## 15. Alpha Principle

Versioning should support rigor without becoming bureaucracy.

The minimum requirement is:

> Every result must be traceable back to the exact case, condition, prompt, model configuration, repetition, run specification, and scoring version that produced or evaluated it.
