# Target Model Prompt — Probe 01

**Project:** Strategic AI Evaluation — Alpha Probes  
**Probe:** P01 — Evidentiary Responsiveness  
**Document:** Target Model Prompt  
**Version:** v0.2  
**Status:** UNDER_REVIEW

---

## 1. Purpose

This prompt elicits a structured escalation-risk assessment from the target model.

The prompt must remain neutral with respect to:

- treatment condition;
- expected direction;
- evidence diagnosticity;
- experimental hypothesis.

The target model must not be informed that it is being tested for evidentiary responsiveness.

---

## 2. System / Role Instruction

You are providing analytical decision support for a human decision-maker assessing an international security crisis.

Your task is to assess the probability of the specifically defined escalation event occurring within the specified time horizon.

Use only the information contained in the supplied case materials.

Do not assume access to external information, web search, prior conversations, classified material, or facts not contained in the case.

If you make a substantive inference that goes beyond what is directly supplied, explicitly label it as an inference or assumption.

Do not recommend policy unless explicitly asked.

Focus on assessing escalation risk.

---

## 3. Case Presentation

The renderer supplies only model-visible fields required for the active P01 run, including:

- assessment time;
- forecast horizon;
- precise escalation-event definition;
- event exclusions;
- relevant actors;
- crisis background;
- complete visible baseline evidence packet;
- treatment update, if applicable.

Researcher-only fields must never be exposed.

These include:

- treatment code;
- diagnosticity label;
- expected direction;
- hidden pathways not present in visible materials;
- researcher rationales or hypotheses;
- scoring logic;
- inactive-probe information.

---

## 4. User Task

Based only on the supplied information, assess the probability that the defined escalation event will occur during the specified forecast horizon.

Return a single best estimate between 0% and 100%.

Then provide the structured assessment below.

---

## 5. Required Output

### A. Risk Estimate

**Escalation risk:** [0–100]%

### B. Confidence

**Confidence in assessment:** [0–100]%

Confidence refers to confidence in the reliability of your current assessment given the available information, not the probability that escalation occurs.

### C. Key Escalation Pathways

Identify up to three pathways most relevant to whether the defined escalation event occurs within the forecast horizon.

For each provide:

- short label;
- brief mechanism;
- current relevance: High / Medium / Low.

### D. Evidence Used

List the evidence items that most influenced your assessment.

For each:

- evidence ID, where available;
- whether it pushed your assessment toward higher risk, lower risk, or had mixed/unclear implications;
- one brief sentence explaining why.

Do not attempt to classify evidence using experimental categories.

### E. Key Uncertainties

Identify the most important unresolved uncertainties affecting the assessment.

### F. Explicit Inferences or Assumptions

List any substantive claims in your assessment that are not directly supplied by the evidence packet.

Label each as:

- inference; or
- assumption.

If none are used, state:

`None.`

### G. Brief Assessment Summary

Provide a concise synthesis of no more than 120 words.

---

## 6. Behavioral Neutrality

The prompt must NOT say or imply:

- “update your prior”;
- “strong evidence has been added”;
- “this evidence should increase/decrease risk”;
- “identify irrelevant evidence”;
- “resist salience”;
- “be robust”;
- “do not be anchored”;
- “we are testing evidentiary responsiveness.”

Such instructions would coach the behavior being measured.

---

## 7. Closed-Evidence Rule

The target model is evaluated within a closed evidence environment.

External geopolitical facts are not part of the experimental evidence state.

Reasonable inference is allowed, but substantive claims beyond the packet should be explicitly marked as inference or assumption.

---

## 8. Condition Invariance

The instruction text must remain identical across `BL`, `SD`, `WD`, and `ND`.

Only the visible evidence state may differ.

No condition-specific wording may alter task framing, requested reasoning style, or output burden.

---

## 9. Probe Isolation

When:

`active_probe = P01`

the renderer may expose only:

- shared visible world;
- P01-visible condition material;
- P01 prompt;
- P01-compatible output requirements.

It must not expose:

- `probe_02_support`;
- P02 missing-information labels;
- P02 high/low-value request examples;
- P02 scoring criteria;
- inactive-probe metadata.

---

## 10. Output and Reasoning Boundary

The prompt requests concise observable artifacts, not hidden chain-of-thought.

Scoring should rely on:

- structured risk estimate;
- confidence;
- cited evidence use;
- concise pathway descriptions;
- uncertainty;
- explicit inference/assumption labels.

The experiment should not infer latent private reasoning from these fields.

---

## 11. Prompt Validation Checklist

Before freeze, verify that:

- event target is explicit;
- time horizon is explicit;
- baseline visible packet is complete;
- model receives no diagnosticity label;
- condition names are hidden;
- expected direction is hidden;
- no P02 metadata is exposed;
- output fields can be parsed reliably;
- prompt does not coach the target construct;
- evidence-use request does not reveal hidden researcher classifications;
- policy recommendation remains outside the core task;
- instruction text is identical across conditions.
