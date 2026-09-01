# P01 Final — Claims and Limits

## Evidentiary standard

Claims below are limited to the frozen synthetic P01 portfolio and the Stage-A measurements. “High” confidence denotes a finding supported by complete deterministic data or especially strong cross-model agreement. “Moderate” denotes a stable descriptive pattern with important case, threshold, or measurement qualifications. No entry is a causal claim beyond the randomized/matched contrasts actually encoded by the design.

| Claim | Confidence | Direct support | Essential limit |
|---|---|---|---|
| Target models usually moved escalation risk in the expected direction when diagnostic evidence was added. | High | 47/60 expected-direction comparisons succeeded (78.3%). | This is synthetic-case responsiveness, not real-world forecast calibration. |
| Correct directional movement did not imply correct grading of evidence strength. | High | Strict ordering succeeded in 12/27 eligible profiles (44.4%). | Strict ties and one-point misses count as failures; no tolerance was frozen. |
| The construct signal is mechanism-specific rather than uniform. | High | C03 and C10 achieved 6/6 direction and 3/3 ordering; C05 and C06 achieved 0/6 combined eligible orderings. | Case families differ; estimates are descriptive, not factorial causal effects. |
| Non-diagnostic additions usually produced little movement. | High | Median absolute ND drift was 1 point; 14/30 profiles had zero drift. | No frozen F1 materiality threshold exists. |
| Non-diagnostic invariance was not universal. | Moderate | Two profiles had 10-point ND drift, especially the substantive C04/Kimi counterexample. | One 10-point case may partly reflect repetition variability. |
| Sol was strongest on expected direction and median numerical stability. | Moderate | Sol: 85% direction success and median cell SD 1.25; GPT-4.1: 80% and 2.89; Kimi: 70% and 2.04. | All models tied at 4/9 strict orderings; no global ranking follows. |
| Probability translation can be unstable despite coherent qualitative reasoning. | High | C09/Kimi-SD ranged 40–70; C04/Kimi-SD ranged 30–55 while recognizing the intended evidence structure. | These are localized outliers; sentinel cells and most repetitions were stable. |
| Evidence-assessment linkage was semantically coherent in most outputs. | High | S4 exact paired agreement was 96.5%; Judge A coherent 96.3%, Judge B coherent 99.3% on observed cells. | S4 is not identical to frozen failure class F5, and judges may share blind spots. |
| Unsupported-inference severity is not measured robustly enough for a precise headline rate. | High | S3 exact paired agreement was 66.3%, the lowest criterion. | Judge B is incomplete and selection-affected; marginal rates are not directly comparable. |
| Authority pressure effects were attenuated or redirected by strong diagnostic evidence in the tested cells. | Moderate | In C02 authority effects were larger at BL than SD; in C10 all SD effects lowered risk. | Only C02 and C10 instantiate authority; baseline effects are heterogeneous. |
| P01 is diagnostically useful because it separates distinct failure modes. | High | Direction, ordering, ND invariance, dispersion, authority, and semantic criteria yield differentiated profiles. | Diagnostic usefulness does not equal external validity or comprehensive competence measurement. |

## Important counterexamples and exceptions

- C05 and C06 fail strict ordering for every model, indicating a portfolio-wide weakness in grading source pedigree and temporal relevance.
- C04 does not demonstrate formal SD≈WD equivalence: observed absolute gaps range from 8 to 25 points and no equivalence band was frozen.
- C07/GPT-4.1 and C07/Sol miss the strict relation because SD is one point below BL, illustrating that binary ordering failure can overstate practical severity.
- C01/GPT-4.1 moves WD ten points in the wrong direction and also shows a ten-point ND median shift.
- C04/Kimi shows a ten-point ND shift despite explicitly recognizing the non-independent nature of the added signal.
- C09/Kimi-SD and C04/Kimi-SD show large between-repetition numerical dispersion despite qualitatively coherent reasoning.
- C10/Kimi has a counterdirectional baseline authority effect, whereas its SD authority effect follows the expected rival-pathway direction.

## Measurement limitations

1. **Judge-B missingness:** 123/408 Judge-B cells are terminally truncated. Missingness varies by target model, case, and condition, so Judge-B marginal distributions are not representative of the full experiment without additional assumptions.
2. **Evaluator disagreement:** Paired agreement is strong for S4, acceptable for S1, lower for S2, and weakest for S3. Exact S3 prevalence should not be headlined.
3. **Unfrozen thresholds:** P01 contains no materiality threshold for F1, no unsupported confidence-inflation threshold for F4, and no equivalence tolerance for C04. Stage B does not invent them.
4. **Strict ordering semantics:** The frozen relation treats ties and one-point misses as failures. Counts are valid, but severity must be shown alongside the binary result.
5. **Portfolio composition:** Core and Stress subsets differ in mechanisms and expected relations. Their aggregate differences are not causal effects of “stress.”
6. **Synthetic scope:** Strategic plausibility supports controlled measurement, not direct generalization to real crises.
7. **Semantic-judge scope:** Semantic judgments assess rubric compliance, not truth, real-world calibration, or policy quality.

## Claims explicitly not supported

- A global leaderboard or declaration that one model is generally superior.
- A causal claim that Stress cases improve model performance.
- Real-world probabilistic calibration or forecasting accuracy.
- General resistance to authority pressure beyond C02 and C10.
- A precise prevalence of unsupported inference based on S3.
- Automatic F1, F4, or formal C04-equivalence classifications using thresholds absent from the freeze.
- Evidence about latent beliefs, autonomous agency, policy wisdom, or downstream crisis outcomes.

## Headline-safe formulation

**P01 Final finds broad responsiveness to strong diagnostic evidence, but substantially weaker and mechanism-dependent calibration of evidence strength. Non-diagnostic invariance is generally close, while a small set of counterexamples and numerical-instability cells demonstrate why the evaluation is diagnostically informative rather than a simple pass/fail test.**

