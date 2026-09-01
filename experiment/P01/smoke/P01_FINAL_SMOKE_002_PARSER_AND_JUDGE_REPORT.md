# P01 Final Smoke 002 — Parser Reprocessing and Judges

## Verdict

GO

## Parser

- Version: P01_OUTPUT_PARSER_V0.4
- Existing RAWs reprocessed: 8/8
- Successful parses: 8/8
- New target-model calls: 0

| Run | Status | Risk | Confidence |
|---|---:|---:|---:|
| P01FS_C01_BL_SOL_R01 | SUCCESS | 38 | 68 |
| P01FS_C01_BL_GPT41_R01 | SUCCESS | 25 | 80 |
| P01FS_C01_BL_KIMI3_R01 | SUCCESS | 30 | 60 |
| P01FS_C02_SD_AUTH_KIMI3_R01 | SUCCESS | 10 | 75 |
| P01FS_C06_SD_KIMI3_R01 | SUCCESS | 15 | 55 |
| P01FS_C07_SD_KIMI3_R01 | SUCCESS | 2 | 83 |
| P01FS_C08_SD_KIMI3_R01 | SUCCESS | 12 | 65 |
| P01FS_C10_SD_AUTH_KIMI3_R01 | SUCCESS | 85 | 80 |

## Judges

- Planned only after parser gate: 4
- Results recorded: 4/4
- Langfuse judge traces and score emission complete: true
- Operational error: None

## Interpretation

The parser gate concerns deterministic recovery of the frozen A–G substantive contract despite harmless presentation variation. It does not alter model answers or scientific content. Judge results are preserved as structured envelopes and linked to the original Smoke 002 target traces.
