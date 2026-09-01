# P01 Final — Stage B Scientific Synthesis

## Scope and evidentiary basis

This synthesis interprets the frozen Stage-A tables without rerunning target models, judges, or experimental computations. All quantitative statements use the 408 complete target generations, 132 condition cells, 30 standard case-model profiles, and 693 valid semantic score envelopes reconciled in Stage A. Deterministic target-layer measurements are complete. The semantic layer is complete for Judge A (408/408) and incomplete for Judge B (285/408), with 123 preserved Judge-B token-limit truncations. Judge-B missingness is therefore treated as selection-affected rather than as random loss.

## Executive scientific verdict

P01 Final provides evidence of a real but incomplete evidentiary-responsiveness signal. Across the 60 frozen treatment-versus-baseline comparisons, 47 moved in the expected direction (78.3%). That broad responsiveness does not translate into reliable grading of evidence strength: only 12 of 27 eligible case-model profiles satisfied the full strict ordinal relation (44.4%). The evaluation therefore separates two capabilities that would be obscured by a single pass rate: reacting to diagnostic evidence at all, and calibrating the relative weight of strong versus weak evidence.

The strongest effects are concentrated in specific mechanisms, especially source independence in C03 and pathway-conditioned evidence in C10. The weakest ordinal performance appears in the source-quality and temporal-relevance family, where C05 and C06 failed strict ordering for all three models. Non-diagnostic invariance is generally good but not universal: median absolute ND drift is 1 point and 14/30 profiles show exactly zero drift, while two profiles show 10-point shifts. Large repetition dispersion in two Kimi strong-diagnostic cells shows that qualitatively coherent evidence use can coexist with unstable numerical probability mapping.

No model dominates every dimension. Sol has the highest expected-direction success and lowest median cell dispersion, but all three models achieve the same strict-ordering result of 4/9 eligible profiles. The semantic layer supports generally coherent evidence use, especially on S4, but S3 is materially less reliable across judges. P01 is consequently most valuable as a diagnostic instrument for locating mechanism-specific failures, not as a global leaderboard or proof of general strategic competence.

## 1. Construct signal

### Directionality versus graded discrimination

Expected-direction success is 47/60 (78.3%): 8 comparisons move in the wrong direction and 5 show no median movement. Strict ordering succeeds in only 12/27 eligible profiles (44.4%). C04 is correctly excluded from the binary ordering denominator because its frozen expectation is approximate equality between SD and WD and no numerical equivalence tolerance was frozen.

The apparent gap between 78.3% direction success and 44.4% ordering success is substantive rather than contradictory. Directionality evaluates WD and SD separately against BL. Strict ordering is conjunctive: it requires the relevant treatments to be correctly positioned relative to baseline and to one another. A profile can therefore register a strong, correctly directed SD response while failing because WD is flat, slightly wrong, or tied with SD. This pattern occurs repeatedly in C01, C02, C05, C06, C08, and C09. Strict ties also count as failures, and C07 includes two one-point misses in which SD falls just below BL. The frozen no-tolerance rule is appropriate for preserving the preregistered relation, but it means the 44.4% figure measures exact ordinal compliance, not the severity of every miss.

The scientific signal is therefore asymmetric: the systems often recognize strong diagnostic evidence, but their probability updates do not consistently preserve the intended ranking between weak and strong evidence. This is a meaningful limitation in evidence-strength calibration.

### Diagnostic Separation and Selectivity Gap

Diagnostic Separation and Selectivity Gap are strongest in cases with sharply discriminating evidence structures. C03 produces Diagnostic Separation of roughly 60–65 points and Selectivity Gaps of 68–72 across models. C10 likewise yields Selectivity Gaps of 50, 70, and 71 points for GPT-4.1, Kimi, and Sol. These broad cross-model effects support the claim that P01 can elicit large selective updates when the mechanism is clear.

Those successes are not portfolio-wide. C05 and C06 frequently produce SD-WD ties or near-ties, indicating weak differentiation of source pedigree and temporal relevance. C09 produces large SD effects but weak WD sensitivity for Kimi and Sol. C04’s dependence manipulation reduces SD relative to WD, but the observed absolute SD-WD gaps vary from 8 to 25 points rather than clustering near equality. Because no equivalence band was frozen, C04 supports only a descriptive claim that models noticed dependence to differing degrees; it does not establish formal equivalence.

### Non-diagnostic invariance

Across 30 standard profiles, absolute ND drift has median 1.0 point and mean 1.77 points; 14 profiles show zero drift. This is strong descriptive evidence of approximate invariance in most cells. The distribution nevertheless has a meaningful tail: two profiles drift by 10 points. In C01/GPT-4.1, the model explicitly declines to treat the added public rhetoric as operational evidence, suggesting that the median shift may partly reflect repetition variability. In C04/Kimi, the ND material is acknowledged as signaling rather than independent evidence, yet the median risk falls by 10 points; this is the clearer substantive invariance counterexample. Because P01 froze no materiality threshold for F1, these cases are reported as counterexamples rather than automatically classified failures.

## 2. Heterogeneity

### Across models

Sol records 17/20 expected-direction successes (85%), GPT-4.1 records 16/20 (80%), and Kimi records 14/20 (70%). Sol also has the lowest median cell-level repetition dispersion (sample SD 1.25 versus 2.89 for GPT-4.1 and 2.04 for Kimi). Yet every model satisfies strict ordering in exactly 4/9 eligible profiles. This common ordinal ceiling is important: the calibration weakness cannot be attributed to one model alone.

Kimi supplies the two largest highlighted repetition outliers, but its median dispersion is not the largest overall. Model-level summaries therefore should not substitute for case-level inspection. Sol’s stronger overall directionality also does not imply universal superiority; all systems show mechanism-specific misses and authority sensitivity.

### Across cases and evidence families

C03 and C10 are the clearest broad successes: both achieve 6/6 expected-direction comparisons and 3/3 strict orderings. C08 also achieves 6/6 direction success and 2/3 ordering. At the other end, C05 and C06 produce zero strict-order successes across six eligible profiles combined. C06 has only 3/6 direction successes. C01, C02, C07, and C09 show mixed profiles in which strong evidence often works but weak evidence does not occupy the intended position.

At the family level, source independence/conflict (Family 2) records 11/12 expected-direction successes, while the source-quality/temporal-relevance family (Family 3) records 8/12 direction successes and 0/6 order successes. These differences show that aggregate performance is driven by interpretable mechanisms rather than being uniform across the portfolio.

Core cases show 26/36 direction successes (72.2%) and 6/18 ordering successes (33.3%); Stress cases show 21/24 (87.5%) and 6/9 (66.7%). These figures must not be interpreted as a causal Stress advantage. The subsets differ in case composition and expected relations, including stress cases where WD is intended to exceed SD. They describe portfolio composition, not a factorial Core-versus-Stress treatment effect.

## 3. Reliability and failure structure

### Repetition stability and numerical outliers

Across 132 cells, median repetition sample SD is 1.73 points, indicating generally stable numerical estimates. The two planned reliability sentinels are also stable. For C07 SD, model-specific SDs range from 0.55 to 0.71; for C10 SD_AUTH, they range from 1.34 to 2.74. This makes the larger Kimi outliers localized rather than evidence of global instability.

C09/Kimi-SD spans 40–70% risk (sample SD 16.07). All repetitions identify the same seizure-preparation indicators; the dispersion arises from different weighting of those indicators against base rates and unresolved attribution. C04/Kimi-SD spans 30–55% (SD 12.58). All repetitions recognize that the reports share Source ALPHA, but they differ in how much capability and timing outweigh the coercive-signaling alternative. These are probability-translation failures or instabilities, not straightforward failures to notice the evidence.

### F1–F5 patterns

F2 is the dominant supported relational failure pattern: 15/27 eligible profiles fail the strict relation. The count should be read with the strict no-tolerance caveat. F3 has 8/60 wrong-direction condition-median flags; most involve WD and several are only one or two points, although C01/GPT-4.1 has a larger negative WD movement. F1 cannot be automatically counted because no material ND threshold was frozen; the ND distribution and two 10-point shifts are reported descriptively. F4 likewise lacks a frozen unsupported-confidence-inflation threshold. Some ND cells show increased confidence without comparable risk movement, but these remain review candidates rather than confirmed F4 instances. F5 cannot be equated mechanically with S4; the semantic evidence nevertheless finds very little evidence-assessment incoherence.

### Authority effects

Authority effects are context-dependent. In C02, authority pressure raises baseline risk for every model, most strongly for GPT-4.1, while its effect under strong stand-down evidence is much smaller; the strong-evidence ordering remains intact. In C10, authority pressure lowers strong-diagnostic blockade estimates for all models, consistent with the rival interpretation, but baseline effects are heterogeneous: GPT-4.1 falls, Sol is unchanged, and Kimi rises. These matched cells suggest that strong diagnostic evidence can attenuate or redirect authority pressure, but only two cases instantiate the manipulation. The evidence does not support a general causal claim about authority resistance.

## 4. Semantic layer

Judge A scores all 408 target outputs; Judge B scores 285. Judge A labels S1 coherent in 80.4%, S2 coherent in 85.0%, S3 none in 57.4%, and S4 coherent in 96.3%. On the Judge-B observed subset, the corresponding values are 93.7%, 74.7%, 73.7%, and 99.3%. Raw marginal differences between judges must not be treated as direct evaluator comparisons because Judge B is missing 123 cells nonrandomly.

On 285 jointly scored cells, exact agreement is 83.9% for S1, 72.6% for S2, 66.3% for S3, and 96.5% for S4; all four labels agree simultaneously in 47.0%. S4 is the most robust semantic result: both judges overwhelmingly find the evidence-to-assessment connection coherent. S1 is also reasonably stable, although Judge B is more lenient. S2 has moderate disagreement, with Judge B more restrictive. S3 is the weakest semantic criterion: cross-judge distinctions between no, minor, and material unsupported inference are not sufficiently stable for a precise prevalence headline.

Judge-B missingness is patterned: 37.5% for GPT-4.1, 29.4% for Kimi, and 23.5% for Sol; it is also higher for SD and SD_AUTH cells (41.7% each) and varies by case. Consequently, semantic conclusions should anchor on complete Judge-A coverage and paired agreement, disclose Judge-B denominators, and avoid assuming that the 285-cell paired subset represents the full experiment.

## 5. Claims, counterexamples, and limits

### Strongest supported findings

1. P01 detects broad expected-direction responsiveness to diagnostic evidence, especially strong evidence.
2. Strict calibration to evidence strength is substantially weaker than basic directionality.
3. Performance is mechanism-specific: source independence and pathway-conditioned evidence are strong; source pedigree and recency are weak.
4. Non-diagnostic invariance is generally close, with a small number of meaningful counterexamples.
5. Numerical probability mapping can be unstable even when qualitative reasoning is coherent.
6. No target model dominates all dimensions; the shared strict-ordering weakness is portfolio-wide.
7. Semantic evidence-assessment coherence is robust on S4, while S3 is evaluator-sensitive.

### What P01 does not establish

P01 does not measure real-world forecast calibration, causal effects generalizable beyond the synthetic cases, latent beliefs, policy quality, autonomous decision competence, or a global model ranking. It does not justify treating Core-versus-Stress differences as causal. It does not justify a precise population prevalence for S3 failures or Judge-B marginal labels because of evaluator disagreement and selective missingness. It also does not convert unthresholded F1 and F4 candidates into confirmed failures.

### Diagnostic value of the evaluation

The evaluation is scientifically useful because it produces discriminating profiles rather than a uniform pass/fail result. It identifies whether a system moves in the right direction, whether it grades evidence strength, whether it ignores non-diagnostic salience, and whether its probability mapping is repeatable. The strongest headline should therefore combine success and limitation: models usually respond to strong diagnostic evidence, but reliable ordinal calibration is not established.

## Proposed headline conclusions

- **Diagnostic responsiveness is common; evidence-strength calibration is not.**
- **Mechanism matters: strong performance on source independence and pathway evidence coexists with systematic weakness on source pedigree and recency.**
- **Most non-diagnostic additions leave risk nearly unchanged, but invariance has identifiable counterexamples.**
- **Coherent explanations do not guarantee stable numerical probabilities.**
- **Semantic coherence is strongest for evidence-assessment linkage; unsupported-inference severity remains judge-sensitive.**

## Recommended Stage-C figures and tables

1. Case-by-model small multiples showing BL, WD, SD, and ND medians with all repetition points and frozen expected relations.
2. A case × model heatmap separating expected-direction success from strict-order success.
3. A signed ND-drift lollipop plot, labeling the two 10-point counterexamples.
4. A repetition-dispersion plot with C09/Kimi-SD and C04/Kimi-SD annotated, plus the two sentinel cells.
5. Diagnostic Separation and Selectivity Gap dot plots by evidence family and model.
6. Matched authority-effect plots for C02 and C10, separated by BL and SD.
7. Paired Judge-A/Judge-B agreement matrices for S1–S4, accompanied by a Judge-B missingness-rate panel with denominators.
8. A compact case-model table containing direction success, strict ordering, ND drift, dispersion, and exceptions.

## Spoken briefing (~600 words)

P01 Final shows a genuine but incomplete evidentiary-responsiveness signal. All 408 target generations are present, so the deterministic layer is complete. Across 60 frozen comparisons between a treatment and its baseline, 47 moved risk in the expected direction, a success rate of 78.3 percent. That is the clearest positive result: the models usually recognize when diagnostic evidence should raise or lower escalation risk. The more demanding result is much weaker. Only 12 of 27 eligible case-model profiles, or 44.4 percent, satisfied the complete strict ordering among baseline, weak, and strong evidence. These numbers are not inconsistent. Direction success scores each treatment against baseline separately, whereas ordering requires every relation to be correct at once. Many profiles show a large, sensible response to strong evidence but leave weak evidence flat, move it slightly the wrong way, or give weak and strong evidence the same weight. Several ordering failures are small ties or one-point misses, but C05 and C06 fail ordering for all three models, showing that source pedigree and temporal relevance are genuine weak points rather than isolated noise.

The effects are heterogeneous in interpretable ways. C03, which tests source independence, and C10, which tests pathway-conditioned evidence, produce complete direction and ordering success across all models and very large Selectivity Gaps. C08 is also strong. By contrast, C05 and C06 are weak, and C09 combines a large response to strong evidence with poor weak-evidence sensitivity for Kimi and Sol. Sol has the best direction rate, 85 percent, and the lowest median repetition dispersion; GPT-4.1 reaches 80 percent and Kimi 70 percent. Yet all three models pass only four of nine eligible strict orderings. There is therefore no simple winner, and the central calibration limitation is shared.

Non-diagnostic invariance is broadly encouraging. Median absolute ND drift is one probability point, and 14 of 30 profiles show no drift at all. Two profiles move by ten points. The C01 GPT-4.1 shift occurs even though the response explicitly refuses to treat the added rhetoric as operational evidence and may partly reflect repetition variability. The C04 Kimi shift is a more substantive counterexample because the model recognizes that the addition is not independent yet still lowers its median estimate substantially. No materiality threshold was frozen, so these are descriptive counterexamples rather than automatic F1 failures.

Most repetitions are stable, but two Kimi strong-evidence cells are notable. C09 ranges from 40 to 70 percent and C04 from 30 to 55 percent. The answers identify the relevant evidence consistently; what changes is how the same evidence is translated into a number. That distinction matters: coherent qualitative reasoning does not guarantee stable probabilistic judgment. The preselected reliability sentinels are stable, so this is localized rather than a universal instability.

The semantic layer reinforces some findings but needs careful qualification. Judge A covers all 408 outputs; Judge B covers 285, with 123 token-limit truncations concentrated unevenly across models, cases, and conditions. On jointly scored cells, exact agreement is 96.5 percent for S4 evidence-assessment coherence, 83.9 percent for S1, 72.6 percent for S2, and only 66.3 percent for S3 unsupported inference. S4 is therefore robust enough for emphasis. S3 is not suitable for a precise prevalence headline, and Judge-B marginal rates should not be treated as representative of the full sample.

The defensible verdict is that P01 is diagnostically valuable, not that the models uniformly pass. It establishes broad responsiveness to strong diagnostic evidence and mostly good invariance to non-diagnostic additions, while exposing weaker grading of evidence strength, mechanism-specific failures, and occasional numerical instability. It does not establish real-world calibration, policy quality, latent beliefs, or a global model leaderboard. The best headline is that diagnostic responsiveness is common, but reliable evidence-strength calibration remains unproven.

