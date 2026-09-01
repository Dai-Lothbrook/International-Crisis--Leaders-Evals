# Domain & Scope

**Project:** Strategic AI Evaluation — Alpha Probes  
**Document:** Domain & Scope  
**Version:** v0.2  
**Status:** FROZEN FOR ALPHA

---

## 1. Evaluation Domain

This project evaluates frontier language models as **decision-support components in the Outer Loop of strategic foreign-policy and national-security judgment**, rather than as autonomous strategic decision-makers.

The broader domain is:

> **Strategic assessment under crisis uncertainty**

The model's role is that of an **analyst/adviser** supporting a human decision-making process before action is authorized.

The model is not asked to autonomously control the strategic environment, execute policy, operate weapons, or make the final sovereign decision.

---

## 2. Alpha Probe Structure

The Alpha contains distinct probes that share common infrastructure but evaluate different constructs.

### Probe 1

Probe 1 evaluates:

> **Escalation-Risk Assessment under Strategic Uncertainty**

For each matched case branch, the model is asked to assess the probability of a **pre-defined escalation event** occurring within a **fixed time horizon**, using only the evidence supplied in the experimental packet.

Every Probe 1 case MUST therefore specify:

1. **Risk target** — probability of WHAT event?
2. **Time horizon** — probability by WHEN?

The risk target and time horizon MUST remain constant across matched variants of the same case and MUST be fixed before target-model outputs are observed.

### Probe 2

Probe 2 evaluates a distinct construct related to:

> **Information Seeking under Insufficient Evidence**

Probe 2 may reuse the same strategic scenario family and common infrastructure, but it has its own construct, failure taxonomy, variants, and scoring logic.

---

## 3. Probe 1 Core Construct

The core construct is:

> **Evidentiary Responsiveness in Escalation-Risk Assessment**

The construct concerns how the model's expressed escalation-risk belief state changes when the evidentiary structure changes.

The desired property is:

> **Appropriate responsiveness**

composed of:

- **Appropriate sensitivity:** risk beliefs should respond to genuinely diagnostic evidence.
- **Appropriate invariance:** risk beliefs should remain comparatively stable under information that is salient but non-diagnostic.

The Alpha does NOT assume that robustness means simple stability.

Failure to update when diagnostic evidence arrives may constitute **rigidity**.

Excessive updating to weak or non-diagnostic information may constitute **fragility**.

---

## 4. Measurement Boundary

The primary Probe 1 measurement boundary is:

> **Provided evidence state → Expressed escalation-risk belief state**

Core observable outputs may include:

- escalation-risk estimate;
- confidence or stated uncertainty;
- identified escalation pathways;
- evidentiary basis;
- changes in risk estimate across matched experimental conditions.

The experiment evaluates expressed outputs and artifacts. It does not claim access to the model's latent internal beliefs or private reasoning process.

---

## 5. Out of Scope for Probe 1 Core Scoring

Probe 1 does NOT directly score:

- true adversary intent;
- optimal policy choice;
- final strategic recommendation;
- whether escalation ultimately occurs in the real world;
- a single exact “correct” probability;
- general foreign-policy competence;
- autonomous strategic decision-making;
- deployment safety in general.

Intent-related information may appear inside the evidence packet but is treated as an **input to escalation-risk assessment**, not as the experiment's ground-truth target.

---

## 6. Experimental Logic

Probe 1 uses **independent matched branches**, not sequential belief updating.

Core Alpha conditions are:

1. Baseline
2. Strong diagnostic evidence
3. Weak/moderately diagnostic evidence
4. Salient but non-diagnostic evidence

Across the case set, diagnostic evidence should be **bidirectional**:

- some evidence should increase escalation risk;
- some evidence should decrease escalation risk.

The experiment evaluates primarily:

- **direction** — whether movement occurs in the pre-specified direction;
- **ordering** — whether stronger diagnostic evidence produces greater movement than weaker/non-diagnostic evidence;
- **invariance** — whether salient non-diagnostic information produces comparatively little movement;
- **relative treatment effects** within matched cases and within models.

It does not require specifying an exact normatively correct probability shift.

---

## 7. Evidence Environment

Unless otherwise specified, Probe 1 uses a:

> **Closed Evidence Packet**

Substantive factual claims should therefore either:

1. be grounded in the supplied evidence; or
2. be explicitly identified by the model as inference, assumption, or uncertainty.

External factual retrieval and tool use are not part of the Alpha core task unless introduced later as an explicit experimental condition.

---

## 8. Alpha Claim Boundary

The Alpha may support bounded claims such as:

> Under the controlled conditions of this experimental instrument, a model showed differential responsiveness to evidence with pre-specified diagnostic value.

Comparisons across models are exploratory at Alpha scale and should be interpreted through **within-model, within-case treatment effects**, not absolute probability levels alone.

The Alpha does NOT support claims such as:

> Model X has superior strategic judgment.

or:

> Model X is safe to deploy in national-security decision-making.

---

## 9. Probe Relationship

The probes may share:

- domain constraints;
- case templates;
- scenario-family conventions;
- model configuration infrastructure;
- naming/versioning;
- run harness;
- logging;
- portions of the output and judge infrastructure.

They should not be assumed to share:

- the same construct;
- the same failure taxonomy;
- the same perturbation logic;
- the same primary dependent variables;
- the same scoring specification.

---

## 10. Design Principle

The project deliberately chooses:

> **Less breadth, more identification.**

Rather than simulating the entire strategic decision process, the Alpha isolates narrower decision-support functions so that construct validity, perturbation validity, scorer validity, repetition, and causal interpretation can receive greater methodological attention.
