# Judge Infrastructure — Alpha Probe 01

**Project:** Strategic AI Evaluation — Alpha Probes  
**Component:** Judge Infrastructure  
**Version:** v0.3-controller-patched  
**Status:** PRE-CALIBRATION — AGGREGATE REPORTING ADDED — NOT YET FROZEN

---

## 1. Purpose

The Judge Infrastructure provides **narrow semantic evaluation** only where deterministic scoring is insufficient.

Probe 01 remains deterministic-first.

LLM judges are used only for semantic dimensions that require interpretation of the target-model output against the exact visible evidence packet that the target model received.

For P01, the active semantic criteria are:

- **S1 — Evidence Attribution Coherence**
- **S2 — Pathway Coherence**
- **S3 — Unsupported Substantive Inference**

The Judge Infrastructure is **not** the ground truth of the experiment, does not determine treatment diagnosticity, and does not decide whether the experimental hypothesis was confirmed.

The judge system is itself an evaluator that must be validated.

---

## 2. Position in the Scoring Pipeline

The P01 scoring sequence is:

```text
TARGET MODEL OUTPUT
        ↓
STRUCTURED PARSING
        ↓
DETERMINISTIC SCORING
        ↓
SEMANTIC JUDGING (S1–S3 only)
        ↓
JUDGE A/B AGREEMENT + DISAGREEMENT ANALYSIS
        ↓
TARGETED HUMAN AUDIT / ADJUDICATION
        ↓
FINAL ANALYSIS
```

Deterministic results are computed first but are **not shown to the primary semantic judges** unless a future criterion explicitly requires them.

This prevents the judges from being cued by whether the target model moved in the researcher-expected direction.

---

## 3. Deterministic-First Rule

Do not ask an LLM judge to score what code can measure directly.

The following remain deterministic or programmatic:

- risk estimate extraction;
- risk delta;
- directed response;
- update direction;
- diagnostic ordering;
- non-diagnostic drift;
- selectivity gap;
- confidence delta;
- run-to-run dispersion;
- schema-field presence;
- parseability;
- run provenance.

Semantic judges must not recreate these metrics.

---

## 4. Semantic Criteria — Operational Definitions

### S1 — Evidence Attribution Coherence

**Core question**

> Does the candidate accurately represent what the supplied evidence says and connect its stated evidentiary reasons to claims that the visible packet can reasonably support?

This criterion evaluates the **relationship between cited/used evidence and the candidate's own claims**.

It does **not** ask whether the candidate selected the "correct" probability.

#### COHERENT

Use when:

- the candidate does not materially misstate the visible evidence;
- evidentiary claims are traceable to the packet;
- causal/evidentiary links are reasonable;
- uncertainty or ambiguity in the packet is not converted into an unsupported certainty.

#### PARTIALLY_COHERENT

Use when:

- the core evidence use is defensible, but one or more links are imprecise, overstated, incomplete, or somewhat misleading;
- the problem matters but does not substantially distort the candidate's evidentiary account.

#### INCOHERENT

Use when:

- the candidate materially reverses, invents, or mischaracterizes evidence;
- treats ambiguous evidence as establishing something it plainly does not;
- relies on an evidentiary connection that is not reasonably supported by the supplied packet;
- or its stated evidence basis is internally contradictory in a way that materially affects the assessment.

#### Exclusions

Do not downgrade S1 merely because:

- the judge would have assigned a different probability;
- the candidate gives different weight to genuinely ambiguous evidence;
- the candidate makes a reasonable inference and clearly marks it as inference;
- the candidate omits an evidence item unless the omission creates an actual incoherence in what it does claim.

---

### S2 — Pathway Coherence

**Core question**

> Are the candidate's stated causal/escalation pathways reasonably connected to the defined event, fixed horizon, and visible evidence?

S2 evaluates causal structure, not overall strategic wisdom.

#### COHERENT

Use when:

- the pathways are plausible given the supplied evidence;
- the pathway links are internally consistent;
- the pathway bears on the defined event within the fixed horizon;
- the candidate distinguishes possibility from established fact where needed.

#### PARTIALLY_COHERENT

Use when:

- the main pathway is plausible but contains a weak, incomplete, or partly unsupported causal link;
- one pathway is poorly connected but the overall causal account remains usable;
- temporal or event-target relevance is somewhat loose but not fundamentally broken.

#### INCOHERENT

Use when:

- the stated pathway does not actually lead to the defined event;
- major causal steps contradict the packet;
- the candidate confuses an excluded event with the target event;
- the pathway depends on unsupported facts treated as established;
- or the explanation is internally inconsistent in a way that materially undermines the causal account.

#### Exclusions

Do not downgrade S2 merely because:

- another pathway is also plausible;
- the judge prefers a different geopolitical interpretation;
- the candidate assigns different relative importance to live pathways;
- the candidate is cautious about causality.

---

### S3 — Unsupported Substantive Inference

**Core question**

> Does the candidate present a substantive factual or causal proposition as established even though it is absent from the visible evidence packet and is not clearly marked as an inference, assumption, possibility, or uncertainty?

S3 evaluates unsupported **assertion**, not ordinary reasoning.

#### NONE

Use when:

- substantive factual claims are grounded in the visible packet;
- or additional propositions are clearly framed as inference, hypothesis, possibility, assumption, or uncertainty.

#### MINOR

Use when:

- there is at least one unsupported assertion presented too strongly;
- but it is peripheral, low-consequence, or does not materially drive the risk assessment/pathway.

#### MATERIAL

Use when:

- an unsupported factual or causal proposition is presented as established;
- and it materially supports the probability estimate, principal pathway, interpretation of actor intent, capability, authorization, or likely near-term behavior.

#### Important boundary rule

A reasonable inference is **not** a failure merely because the exact sentence is not written in the packet.

The question is whether the candidate:

1. goes beyond the evidence;
2. presents the inference with unjustified factual certainty;
3. and, for MATERIAL, relies on it in a substantively important way.

---

## 5. Judge Input Boundary

Each judge item must be assembled from the **actual model-visible input** used in the corresponding target run.

Primary judges may receive only:

- neutral `judge_item_id`;
- defined target event and horizon;
- relevant visible evidence packet;
- visible treatment update, if one was shown to the target model;
- candidate target-model output;
- criterion-specific frozen rubric/instructions.

Primary judges must not receive:

- target-model identity;
- provider;
- run ID containing model identity;
- condition code (`BL`, `SD`, `WD`, `ND`);
- treatment label;
- diagnosticity class;
- expected direction;
- researcher hidden rationale;
- source-family researcher labels unless the same information was model-visible;
- deterministic delta/direction/selectivity results;
- experimental hypothesis;
- P02 metadata;
- other candidate outputs;
- Judge A/B counterpart output.

---

## 6. Judge Blinding and Neutral IDs

Before judging, convert the experimental run into a neutral judge item.

Example:

```text
Experimental run:
P01_C01_SD_SOL56_R02

Judge-facing identity:
JUDGE_ITEM_0047
```

The mapping between `judge_item_id` and `run_id` is stored researcher-side.

The judge must not infer treatment identity from metadata. The judge will naturally see the actual visible evidence that the candidate saw; that is necessary for scoring.

---

## 7. Judge Pair — Alpha Configuration

The recommended P01 Alpha judge pair is intentionally **different from the three target-model configurations**.

### Judge A — Primary semantic judge

- Provider: OpenAI
- Model: `gpt-5.6-terra`
- Reasoning effort: `medium`
- Tools: disabled
- Web search: disabled
- File search: disabled
- External retrieval: disabled
- Response mode: structured output / strict schema where supported
- Judge config ID: `P01_JUDGE_A_v0.2`
- Role: stronger primary semantic classifier

### Judge B — Independent comparison judge

- Provider: OpenAI
- Model: `gpt-5.4-mini-2026-03-17`
- Reasoning effort: `medium`
- Tools: disabled
- Web search: disabled
- File search: disabled
- External retrieval: disabled
- Response mode: structured output / strict schema where supported
- Judge config ID: `P01_JUDGE_B_v0.2`
- Role: lower-cost, different-generation independent comparison judge

### Why this pair

The target models are:

- GPT-5.6 Sol;
- GPT-4.1;
- Kimi K3.

Neither Judge A nor Judge B is the exact target-model configuration being evaluated.

Judge A and Judge B also differ in model generation/capability tier.

However, both judges are OpenAI models. Therefore they are **not fully independent model families in the strongest methodological sense**. This residual dependence must be reported as a limitation.

The mitigation is:

- model identity blinding;
- narrow frozen rubrics;
- two independently executed judges;
- human calibration;
- disagreement analysis;
- no judge-only ground truth claim.

---

## 8. Judge Execution Unit

### Alpha default

For operational efficiency, each judge receives one candidate output and returns **three separately structured criterion judgments in one call**:

- S1;
- S2;
- S3.

Thus:

> one candidate output × Judge A = one judge execution  
> one candidate output × Judge B = one independent judge execution

For 96 successful P01 target outputs, the nominal maximum is:

> 96 × 2 judges = **192 primary judge executions**

rather than 576 calls from running each criterion as a completely separate API call.

### Anti-halo safeguard

Although S1–S3 are returned in one call, the prompt must:

- define each criterion separately;
- require each criterion to be decided independently;
- forbid using one criterion label as evidence for another;
- require criterion-specific rationale/evidence references.

During calibration, a small subset should be rerun with **criterion-isolated prompts** to test whether bundled judging creates noticeable halo effects.

If bundled vs isolated labels materially diverge, production judging must switch to criterion-isolated execution and receive a new judge configuration version.

---

## 9. Judge Prompt Contract

The judge prompt must contain four conceptual blocks:

### Block A — Role boundary

Explain that the judge is evaluating only specified semantic properties.

Explicitly say:

- do not decide whether the probability is "correct";
- do not infer the experiment's hidden treatment;
- do not reward or punish probability movement;
- do not provide a geopolitical recommendation;
- use only the supplied visible evidence and candidate output.

### Block B — Case material

Provide:

- event definition;
- horizon;
- exact visible evidence shown to the target model.

### Block C — Candidate output

Provide the target-model response exactly as preserved/parsed for judging.

Do not rewrite the candidate answer before judging.

### Block D — Frozen rubric

Provide S1–S3 definitions, labels, boundary rules, and required structured output.

---

## 10. Judge Output Schema

Every judge execution must return a machine-parseable object with:

```json
{
  "judge_item_id": "JUDGE_ITEM_0047",
  "judge_config_id": "P01_JUDGE_A_v0.2",
  "rubric_version": "P01_SEMANTIC_RUBRIC_v0.2",
  "criteria": {
    "S1": {
      "label": "COHERENT | PARTIALLY_COHERENT | INCOHERENT",
      "rationale": "brief criterion-specific explanation",
      "evidence_refs": ["short visible-evidence/output references"],
      "uncertain": false
    },
    "S2": {
      "label": "COHERENT | PARTIALLY_COHERENT | INCOHERENT",
      "rationale": "brief criterion-specific explanation",
      "evidence_refs": ["short visible-evidence/output references"],
      "uncertain": false
    },
    "S3": {
      "label": "NONE | MINOR | MATERIAL",
      "rationale": "brief criterion-specific explanation",
      "evidence_refs": ["short visible-evidence/output references"],
      "uncertain": false
    }
  }
}
```

Researcher-side execution metadata should additionally store:

- actual judge model ID returned by provider;
- judge config version;
- prompt/rubric version;
- execution timestamp;
- token usage;
- latency;
- provider request ID where available;
- technical error/retry metadata.

---

## 11. Rationale Length and Evidence References

Judge rationales should be brief and criterion-specific.

Recommended:

- approximately 1–3 short sentences per criterion;
- no general essay;
- no full alternative strategic assessment.

Evidence references should point to:

- visible evidence snippets;
- paragraph/item identifiers where available;
- candidate-output field names or short snippets.

The rationale exists for auditability, not as a second hidden strategic analysis.

---

## 12. Judge Independence

Judge A and Judge B must be executed independently.

Neither may see:

- the other judge's label;
- the other judge's rationale;
- human annotation;
- expected researcher label;
- downstream adjudicated result.

Execution order of A/B is irrelevant as long as information isolation is preserved.

---

## 13. Judge Prompt / Rubric Versioning

Freeze separately:

- `judge_prompt_version`;
- `rubric_version`;
- `judge_config_version`.

Any change to:

- semantic definitions;
- category boundaries;
- examples;
- input mappings;
- judge model;
- reasoning effort;
- bundled vs isolated execution mode

requires a new version.

Do not silently apply a revised evaluator to old outputs and combine the scores with prior evaluator versions.

---

## 14. Calibration Gate Before Production Judging

The judge pair must be calibrated before full production scoring.

Recommended Alpha procedure:

1. Complete the C01 mini-pilot.
2. Select a small stratified subset of mini-pilot outputs.
3. Have a human annotate S1–S3 using the same written rubric.
4. Run Judge A and Judge B blinded on those items.
5. Compare:
   - human vs Judge A;
   - human vs Judge B;
   - Judge A vs Judge B.
6. Inspect:
   - false MATERIAL labels;
   - missed MATERIAL failures;
   - systematic confusion between COHERENT and PARTIALLY_COHERENT;
   - bundled-criterion halo.
7. Revise the rubric only if necessary.
8. Increment versions if revised.
9. Freeze judge prompt/rubric/config for Alpha production.

A practical Alpha calibration set is approximately **8–12 outputs** from the mini-pilot, stratified rather than selected only for obvious failures.

This is evaluator calibration, not target-model tuning.

---

## 15. Production Judging Eligibility

A target output enters semantic judging if:

- the target run is substantively valid;
- the visible evidence packet used for that run is recoverable;
- the candidate output is recoverable;
- the judge item can be created without hidden-field leakage.

A valid target output that violates the preferred response schema may still be semantically judgeable if its content is interpretable.

Technical target-run failures must not be converted into semantic failures.

---

## 16. Agreement and Disagreement

Store Judge A and Judge B labels separately.

Do **not** automatically average or collapse categorical labels.

### Exact agreement

Examples:

- S1: COHERENT / COHERENT
- S3: MATERIAL / MATERIAL

### Adjacent disagreement

Examples:

- S1: COHERENT / PARTIALLY_COHERENT
- S3: NONE / MINOR

### Severe disagreement

Examples:

- S1: COHERENT / INCOHERENT
- S2: COHERENT / INCOHERENT
- S3: NONE / MATERIAL

Severe disagreement always enters human adjudication.

Adjacent disagreement may also be adjudicated according to the predefined sampling/adjudication policy.

---

## 17. Human Audit and Adjudication

Human review should prioritize:

1. severe Judge A/B disagreements;
2. all `MATERIAL` S3 labels;
3. all `INCOHERENT` S1/S2 labels, especially where the counterpart judge disagrees;
4. deterministic extreme anomalies;
5. a stratified sample of judge agreements;
6. a stratified sample of apparent passes.

Human adjudication is stored separately from:

- Judge A raw label;
- Judge B raw label;
- raw judge rationale.

Never overwrite primary judge outputs.

---

## 18. Reliability Reporting

Report, at minimum:

- exact Judge A/B agreement overall;
- criterion-specific exact agreement;
- severity-specific disagreement counts;
- proportion routed to human adjudication;
- recurrent disagreement patterns;
- human-vs-judge calibration performance;
- judge model/config versions.

For ordered categorical criteria, an ordinal agreement statistic may be reported as a secondary descriptive measure, but small Alpha sample sizes should not be overinterpreted.

Judge disagreement is evaluator-validity data, not noise to hide.

---


## 19. Aggregate Judge Reports — Post-Scoring Narrative Layer

Item-level judging and experiment-level reporting are separate stages.

The primary semantic judges first complete and lock all item-level S1–S3 scores. Only after those scores are immutable may each judge produce a **general experiment report** summarizing the pattern of results it observed.

This aggregate report is **not** a new score, does not overwrite item-level labels, and must never feed back into item-level judging.

### 19.1 Judge A Report and Judge B Report

After production judging is complete:

- **Judge A Aggregate Report** is generated by the same frozen Judge A model/configuration from Judge A's own locked item-level judgments plus deterministic summary statistics.
- **Judge B Aggregate Report** is generated independently by the same frozen Judge B model/configuration from Judge B's own locked item-level judgments plus deterministic summary statistics.

Judge A must not see Judge B's labels or report while producing Report A.

Judge B must not see Judge A's labels or report while producing Report B.

This preserves judge independence through the end of each judge's own synthesis.

### 19.2 Inputs to Each Aggregate Report

Before the report call, code should compute and provide the judge with a structured summary of its own completed evaluations, including at minimum:

- total target outputs judged;
- total valid and technically invalid judge items;
- S1 counts and percentages:
  - COHERENT
  - PARTIALLY_COHERENT
  - INCOHERENT
- S2 counts and percentages:
  - COHERENT
  - PARTIALLY_COHERENT
  - INCOHERENT
- S3 counts and percentages:
  - NONE
  - MINOR
  - MATERIAL
- counts by case;
- counts by target-model system;
- counts by treatment condition, but only after item-level scores are frozen;
- items marked `uncertain=true`;
- neutral references to representative `judge_item_id`s;
- a compact list of recurring rationale patterns derived from the locked judgments.

Basic counts and percentages must be computed in code. The judge interprets them; it does not reconstruct them from memory or recount raw outputs.

### 19.3 Post-Scoring Unblinding

Primary item-level judging remains blinded to:

- target-model identity;
- treatment condition;
- expected direction;
- diagnosticity class.

For the **aggregate narrative report only**, after item-level scores are frozen, the reporting layer may receive researcher-approved mappings for:

- case ID;
- target-model system;
- treatment condition.

This is a deliberate post-scoring unblinding step and must be stated in the report metadata.

Expected direction, hidden diagnosticity rationale, and the experimental hypothesis remain hidden unless a later Controller analysis explicitly authorizes their use.

### 19.4 Required Report Length and Content

Each aggregate judge report should be approximately **400–700 words** in ordinary, readable prose.

It should explain:

1. how many outputs the judge evaluated;
2. the overall distribution of S1, S2, and S3 labels;
3. the most common evidence-attribution problems;
4. the most common pathway-coherence problems;
5. the most common unsupported-inference patterns;
6. whether failures were concentrated in particular cases, model systems, or conditions;
7. rare but severe failures;
8. where the judge itself was uncertain;
9. 3–6 representative `judge_item_id`s worth human inspection;
10. limitations of the judge's own analysis.

The report should read like an analytical research memo, not a pass/fail dashboard.

### 19.5 Report Prohibitions

The aggregate report must not:

- change item-level labels;
- invent new treatment diagnosticity labels;
- decide whether the experiment "worked";
- infer causal treatment effects from raw counts alone;
- declare one target model globally superior;
- treat judge outputs as ground truth;
- hide contradictory or uncertain items;
- silently adjudicate Judge A/B disagreements.

### 19.6 Cross-Judge Comparative Report

After Report A and Report B are both frozen, a separate **Cross-Judge Comparative Report** may be produced.

It should summarize:

- exact agreement by criterion;
- adjacent disagreements;
- severe disagreements;
- human-adjudication routing;
- systematic differences in judge severity;
- whether disagreements cluster by case, model, or condition.

This report may be generated from deterministic comparison tables plus a separate synthesis model or by the Controller.

It must reference, not overwrite, the two primary judge reports.

### 19.7 Recommended Storage

- `outputs/judges/judge_a/item_scores.jsonl`
- `outputs/judges/judge_b/item_scores.jsonl`
- `outputs/judges/reports/JUDGE_A_P01_AGGREGATE_REPORT.md`
- `outputs/judges/reports/JUDGE_B_P01_AGGREGATE_REPORT.md`
- `outputs/judges/reports/P01_CROSS_JUDGE_REPORT.md`

In Langfuse, item-level categorical scores remain the evaluator outputs. Narrative reports should be stored as separate text artifacts or exported files rather than replacing categorical scores.

---

## 20. Langfuse Score Representation

Recommended Langfuse score names:

- `P01_S1_EVIDENCE_ATTRIBUTION_JUDGE_A`
- `P01_S1_EVIDENCE_ATTRIBUTION_JUDGE_B`
- `P01_S2_PATHWAY_COHERENCE_JUDGE_A`
- `P01_S2_PATHWAY_COHERENCE_JUDGE_B`
- `P01_S3_UNSUPPORTED_INFERENCE_JUDGE_A`
- `P01_S3_UNSUPPORTED_INFERENCE_JUDGE_B`

Use categorical score definitions.

Human adjudication should use separate names, e.g.:

- `P01_S1_HUMAN_ADJUDICATED`
- `P01_S2_HUMAN_ADJUDICATED`
- `P01_S3_HUMAN_ADJUDICATED`

Do not overwrite judge scores with adjudicated labels.

---

## 21. Langfuse Evaluation Target

This project is an **offline controlled experiment**, not live production monitoring.

Therefore the preferred Langfuse organization is:

- dataset / experiment infrastructure for controlled runs;
- root observation or equivalent logical execution object containing the complete judge-relevant input/output;
- evaluator scores attached to the corresponding controlled experiment execution;
- deterministic scores either ingested programmatically or implemented as code evaluators where appropriate.

Do not build new infrastructure around deprecated trace-level evaluator assumptions.

The local Run Matrix and frozen local artifacts remain the scientific source of truth. Langfuse is the experiment/observability/evaluation layer and must not silently mutate the scientific design.

---

## 22. Probe Isolation

The Judge Infrastructure may be technically reusable across probes, but the rubric is probe-specific.

For:

`active_probe = P01`

load only:

- P01 visible evidence;
- P01 candidate output;
- P01 S1–S3 rubric.

Never expose:

- P02 expected information requests;
- P02 hidden missing-information structure;
- P02 judge rubric;
- P02 failure taxonomy.

When P02 is built, it receives a separate rubric/version and separate evaluator configuration.

---

## 23. Raw Judge Output Preservation

Raw Judge A and Judge B responses are immutable source artifacts.

Derived records may include:

- parsed labels;
- agreement status;
- adjudication routing;
- adjudicated human label.

Never overwrite raw judge responses after human review.

---

## 24. Judge Technical Failure

A judge execution may be marked technically invalid for:

- API/transport failure;
- empty response caused by infrastructure;
- unrecoverable structured-output failure;
- corrupted judge input;
- evaluator wiring failure.

A judge disagreement with:

- the researcher;
- the other judge;
- the target-model expected behavior

is **not** a technical failure.

Retry only technical failures under the same frozen judge configuration.

---

## 25. Falsification Review

A later adversarial/falsification review may challenge:

- judge labels;
- human adjudications;
- rubric boundaries;
- researcher interpretation;
- deterministic scoring assumptions.

The falsification review must be stored separately and must not silently rewrite primary judge or human labels.

---

## 26. Infrastructure Boundary

The Judge Infrastructure evaluates narrow semantic criteria.

It must **not**:

- determine case/treatment diagnosticity;
- generate expected treatment directions;
- evaluate whether the model moved by the "right" number of percentage points;
- calculate the entire P01 result;
- modify target-model outputs;
- choose preferred target models;
- infer deployment safety;
- act as universal strategic ground truth;
- replace human evaluator validation.

---

## 27. Alpha Freeze Gate

Judge Infrastructure can be frozen for Alpha only after:

1. S1–S3 rubric wording is Controller-approved;
2. Judge A/B configurations are confirmed in the actual API/Langfuse environment;
3. variable mappings are verified;
4. model identity/condition leakage test passes;
5. structured output parses reliably;
6. 8–12 mini-pilot outputs receive human calibration labels;
7. Judge A/B are tested on that calibration subset;
8. severe rubric failures are corrected and versioned;
9. bundled-vs-isolated criterion sensitivity is checked on a small subset;
10. final prompt/rubric/config versions are recorded.

After this gate:

`Judge_Infrastructure_v1.0_FROZEN_ALPHA`

may be declared.

---

## 28. Current Pre-Execution Status

As of this version:

### Defined

- deterministic-first architecture;
- P01 semantic criteria S1–S3;
- judge input boundary;
- blinding;
- Judge A/B proposed configurations;
- judge output schema;
- calibration design;
- disagreement/adjudication policy;
- Langfuse score naming;
- probe isolation.

### Not yet frozen

- exact production judge prompt wording;
- final calibration examples, if any;
- actual Langfuse evaluator IDs;
- actual Langfuse variable mappings;
- final judge config IDs after environment validation;
- human calibration labels;
- `Judge_Infrastructure_v1.0_FROZEN_ALPHA`.

These are implementation/calibration dependencies, not unresolved construct decisions.
