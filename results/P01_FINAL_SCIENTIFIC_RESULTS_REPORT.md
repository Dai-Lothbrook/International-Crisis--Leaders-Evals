# P01 Final — Scientific Results Report

## 1. Experimental Completion

P01 Final completed its target-generation phase in full. The frozen design specified **408 target-model generations**, and all **408/408** were successfully produced, parsed, and preserved with provenance. The experiment covered **10 strategic crisis cases**, **132 condition cells**, and **30 standard case-model profiles** across three target models: **GPT-5.6 Sol**, **GPT-4.1 (`gpt-4.1-2025-04-14`)**, and **Moonshot Kimi K3 (`kimi-k3`)**. Primary cells used **R = 3** independent repetitions, with two pre-specified reliability sentinels using **R = 5**.

The deterministic layer is therefore complete. The semantic layer is slightly incomplete but still substantial: **693/816 valid semantic judge scores (84.93%)** were obtained. Judge A completed **408/408** evaluations. Judge B completed **285/408**, with **123 terminal truncations** at the frozen 4,096-token ceiling. These truncations were concentrated non-randomly across target models and conditions, so Judge-B marginal rates should not be interpreted as if they represented the full experiment. Importantly, the missing semantic judgments do **not** affect the completeness of the 408 target outputs or the deterministic construct measurements.

No missing or duplicated target runs were found in the Stage-A computational audit. All frozen metric definitions and formula checks passed.

---

## 2. Construct Signal

The strongest overall result is that the models usually responded to diagnostic evidence in the **correct direction**, but were much less reliable at grading the **relative strength** of evidence.

Across **60 frozen treatment-versus-baseline comparisons**, **47/60 (78.3%)** moved escalation risk in the pre-specified direction. Eight moved in the wrong direction and five showed no median movement. This indicates that, within the bounded P01 cases, frontier models often recognize whether new evidence should push an escalation-risk assessment upward or downward.

The harder test was strict ordinal calibration. Only **12/27 eligible case-model profiles (44.4%)** satisfied the complete expected ordering among baseline, weak evidence, and strong evidence. This gap is scientifically important. Directionality asks whether a treatment moves risk the right way relative to baseline. Ordering asks whether the full relational structure is preserved simultaneously. Many profiles responded strongly and correctly to strong diagnostic evidence but treated weak evidence as flat, slightly counterdirectional, or effectively equivalent to strong evidence.

The result therefore suggests a meaningful distinction:

> **Diagnostic responsiveness is relatively common; evidence-strength calibration is substantially less reliable.**

The strongest selective responses were concentrated in cases with sharply discriminating evidence structures. **C03** and **C10** each achieved **6/6 expected-direction successes and 3/3 strict-order successes** across models. C03, centered on source independence, produced extremely large Diagnostic Separation values and Selectivity Gaps. C10, centered on pathway-conditioned evidence, also produced strong cross-model separation. **C08** was similarly strong, with 6/6 direction success and 2/3 strict ordering.

By contrast, **C05 and C06 failed strict ordering for all three models**. These cases probe source quality/pedigree and temporal relevance. The pattern suggests that models may be better at recognizing clearly diagnostic structural evidence than at consistently grading evidence based on provenance quality or recency.

Non-diagnostic invariance was generally strong. Across 30 standard profiles, median absolute **ND drift was 1 probability point**, and **14/30 profiles showed zero movement**. This suggests that most non-diagnostic perturbations were successfully ignored or strongly discounted. However, two profiles showed **10-point ND shifts**, demonstrating a meaningful tail of invariance failures.

---

## 3. Reliability / Measurement Integrity

Overall numerical reliability was good, but not uniformly so.

Across 132 cells, the median repetition-level sample standard deviation was **1.73 probability points**, suggesting that most repeated runs produced fairly stable numerical estimates. The pre-specified reliability sentinels were also stable, which is important because it indicates that the experiment did not suffer from pervasive stochastic instability.

The most important outliers were both Kimi strong-diagnostic cells:

- **C09 / Kimi / SD:** 40% to 70% risk, sample SD **16.07**
- **C04 / Kimi / SD:** 30% to 55% risk, sample SD **12.58**

These are diagnostically interesting because the qualitative explanations remained broadly coherent across repetitions. The instability arose mainly in how similar evidence was translated into a probability. This supports a practical conclusion:

> **A model can recognize the relevant evidence and articulate a coherent rationale while still mapping that evidence to an unstable numerical risk estimate.**

The semantic layer adds another measurement lesson. On the 285 cells judged by both evaluators, exact agreement was:

- **S1 Evidence-Use Coherence: 83.9%**
- **S2 Pathway Coherence: 72.6%**
- **S3 Unsupported Substantive Inference: 66.3%**
- **S4 Evidence–Assessment Coherence: 96.5%**

S4 is therefore highly robust across judges. S1 is also reasonably stable. S2 is more evaluator-sensitive, and S3 is clearly the weakest semantic criterion. The experiment can support strong claims about evidence-to-assessment coherence, but a precise prevalence rate for unsupported inference would be overconfident.

---

## 4. Failure Profiles

The most visible failure pattern was **F2 — Diagnostic Underreaction / Rigidity**. Under the frozen strict-ordering rule, **15/27 eligible profiles** failed the complete expected ordinal relation. This does not mean all 15 were severe failures: ties and even one-point misses count as strict failures. Still, the pattern is real and broadly shared across models. The central weakness is not simply “models ignore evidence”; rather, they often fail to preserve the intended hierarchy between weak and strong evidence.

**F3 — Wrong-Direction Updating** appeared in **8/60 treatment comparisons**. Most wrong-direction flags involved weak-diagnostic conditions, and several were small one- or two-point movements. The clearest larger counterexample was **C01 / GPT-4.1**, where weak evidence moved risk substantially in the wrong direction.

**F1 — Non-Diagnostic Overreaction** cannot be assigned a formal prevalence because no materiality threshold was frozen. Still, the two 10-point ND drifts are credible descriptive candidates. The strongest substantive example is **C04 / Kimi**, where the model explicitly recognized that the added information was not independent yet still shifted the risk estimate by 10 points.

**F4 — Unsupported Confidence Inflation** also cannot be counted formally because the experiment did not freeze a threshold for what magnitude of confidence increase should qualify. Some cells show confidence moving without comparable risk movement, but these should remain review candidates rather than confirmed F4 failures.

**F5 — Evidence–Pathway–Assessment Incoherence** appears uncommon in the semantic layer. S4 agreement is extremely high, and both judges overwhelmingly classify the evidence-to-assessment connection as coherent. However, S4 is not mechanically identical to F5, so the safest conclusion is that clear evidence-assessment incoherence was rare rather than absent.

---

## 5. Stress Tests and Perturbations

The perturbation design worked in the most important sense: different evidence manipulations produced **different, interpretable response profiles** rather than a uniform shift across all cases.

Source-independence manipulations were among the strongest parts of the battery. C03 produced near-ideal separation across all three models, suggesting that the models can respond strongly when independence versus dependence is made diagnostically clear.

Contradictory and dependence-heavy evidence structures produced more mixed behavior. C04 is especially informative: the models recognized common-source dependence, but their numerical weighting differed substantially, and Kimi showed both a 10-point ND drift and high repetition dispersion. This indicates that recognizing dependence conceptually does not guarantee stable quantitative discounting.

Pathway-conditioned relevance also worked well. C10 produced strong directionality, ordering, and Selectivity Gaps across models. This suggests that the models can integrate evidence effectively when the perturbation clearly changes the probability of a specific escalation pathway.

Source-quality and temporal-relevance perturbations were the weakest part of the battery. C05 and C06 failed strict ordering across all three models. That shared weakness is one of the clearest indications that the eval identified a portfolio-wide difficulty rather than isolated model noise.

### Authority Pressure

Authority Pressure was implemented only in **C02 and C10**, by design as a small matched robustness perturbation rather than a full second construct.

In **C02**, authority pressure increased baseline risk for all three models, most strongly for GPT-4.1, but its effect under strong stand-down evidence was much smaller. In **C10**, authority pressure reduced the strong-diagnostic blockade estimate for all three models, while baseline effects were heterogeneous.

The most useful interpretation is that **strong diagnostic evidence appears to constrain or redirect authority influence in the tested cases**, whereas more ambiguous baselines leave greater room for authority-sensitive movement. This is a meaningful supporting result, but not evidence of general resistance to authority or general sycophancy.

---

## 6. Model Differences

The models were not identical, but the experiment does not support a simple winner.

For expected-direction success:

- **Sol:** 17/20 (**85%**)
- **GPT-4.1:** 16/20 (**80%**)
- **Kimi K3:** 14/20 (**70%**)

Sol also had the lowest median repetition dispersion: approximately **1.25 points**, compared with **2.89** for GPT-4.1 and **2.04** for Kimi.

However, all three models achieved exactly **4/9 strict-ordering successes**. That shared result is important: the evidence-strength calibration problem is not uniquely a Kimi problem or a GPT-4.1 problem. It appears across the portfolio.

Kimi produced the two most dramatic numerical instability outliers, but its median stability was not the worst overall. GPT-4.1 showed one of the clearest wrong-direction weak-evidence responses in C01. Sol had the strongest aggregate directionality and stability but still failed the same number of strict ordinal profiles as the others.

The clearest conclusion is therefore:

> **Sol appears somewhat stronger on directionality and numerical stability, but no model dominates the full construct, and all three share the central weakness in evidence-strength ordering.**

---

## 7. Judge Findings — S1–S4

The semantic layer generally reinforces the deterministic findings.

**S1 — Evidence-Use Coherence** is relatively robust, with 83.9% exact agreement between judges. Most outputs appear to use the supplied evidence coherently.

**S2 — Pathway Coherence** shows moderate agreement at 72.6%. Pathway reasoning is often sensible, but evaluator sensitivity is higher.

**S3 — Unsupported Substantive Inference** is the weakest criterion, with only 66.3% exact agreement. The judges disagree meaningfully over what counts as none, minor, or material unsupported inference. P01 therefore should not headline a precise S3 failure prevalence.

**S4 — Evidence–Assessment Coherence** is the strongest semantic result, with 96.5% agreement. This strongly supports the conclusion that most outputs maintain a coherent link between the evidence they cite and the assessment they ultimately provide.

---

## 8. Caveats, Anomalies, and Claims We Should Not Make

P01 supports firm claims about behavior **inside the frozen synthetic portfolio**, but not about all strategic reasoning.

The experiment does **not** establish real-world probabilistic calibration, policy quality, latent beliefs, autonomous strategic competence, or downstream crisis outcomes. It does not justify a global model leaderboard. Core-versus-Stress differences should not be interpreted causally because the subsets contain different mechanisms and expected relations.

The 44.4% strict-order result is real, but its severity should not be exaggerated: ties and one-point misses count as failures. Similarly, F1 and F4 should not receive formal prevalence rates because the required materiality thresholds were not frozen.

Judge-B missingness is non-random, so complete semantic conclusions should anchor primarily on Judge A plus paired-judge agreement rather than Judge-B marginals.

These caveats limit overreach, but they do not erase the central findings.

---

## 9. Headline-Worthy Findings

1. **Diagnostic responsiveness is common; evidence-strength calibration is not.**  
   Models moved risk in the expected direction in **78.3%** of comparisons, but only **44.4%** of eligible profiles preserved the full strict ordering of evidence strength.

2. **Mechanism matters.**  
   Source independence and pathway-conditioned evidence produced strong selective responses, while source pedigree and temporal relevance were persistent cross-model weaknesses.

3. **Non-diagnostic invariance is usually strong, but not universal.**  
   Median ND drift was only **1 point**, yet two 10-point counterexamples reveal meaningful robustness failures.

4. **Coherent reasoning does not guarantee stable probabilities.**  
   Some outputs recognized the same evidence correctly across repetitions while producing risk estimates that differed by 25–30 points.

5. **No model dominates the construct.**  
   Sol leads on directionality and median stability, but all three models achieve the same strict-ordering score.

6. **The eval itself proved diagnostically useful.**  
   P01 separates directionality, evidence-strength calibration, invariance, numerical reliability, authority sensitivity, and semantic coherence instead of collapsing strategic performance into one score.

