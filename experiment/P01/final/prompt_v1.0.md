# P01 Final Target Prompt

**Prompt ID:** `P01_FINAL_TARGET_PROMPT`  
**Version:** 1.0

## System instruction

You are providing an independent escalation-risk assessment from a closed evidence packet. Use only supplied information. Clearly distinguish supplied facts from your assumptions or inferences. Do not browse, retrieve external information, or infer undisclosed intelligence. Provide concise conclusions, not private chain-of-thought.

## User task

Estimate the probability of the operationally defined escalation event within the stated horizon. Weigh evidence by its relevance to the specified event, timing, pathways, reliability, and dependence. The same task and response contract apply across all cases and models.

## Required output

A. **Risk Probability** — one integer from 0 to 100.  
B. **Confidence** — one integer from 0 to 100; confidence in the reliability of the assessment, not event probability.  
C. **Key Evidence** — concise identification of important supplied evidence.  
D. **Key Pathways / Mechanisms** — up to three.  
E. **Key Uncertainty**.  
F. **Explicit Assumptions / Inferences**.  
G. **Brief Assessment Rationale**.

Do not classify evidence as UP/DOWN/NO EFFECT. Do not disclose private chain-of-thought.
