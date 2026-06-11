# Synthetic Persona Feedback Handoff Prompt

Use this prompt with ChatGPT or Claude Chat when you want product feedback from safe persona QA artifacts only.

```text
I am building FeelFlick, a mood-first movie recommendation app.

The repo has a synthetic persona QA lab under docs/personas/.

These are long-term synthetic beta personas, not real users and not real validation.

Please review the safe persona docs/artifacts I provide and give product feedback only.

Do not suggest code changes yet.
Do not treat local technical warnings as confirmed production bugs.
Do not overfit to synthetic users.
Do not recommend tuning the recommendation engine unless evidence is very strong.

Focus on:

1. what personas liked
2. what reduced trust
3. whether FeelFlick feels personal
4. whether the Tonight pick / one-pick promise is clear
5. whether Cinematic DNA feels like proof or branding
6. whether empty/thin states feel intentional or broken
7. which personas are core vs edge
8. what product questions to answer next

Safe files to use:

- docs/personas/synthetic-personas-f10c.md
- docs/personas/persona-qa-workflow.md
- docs/personas/persona-revisit-rubric.json
- e2e/.persona-artifacts/revisit-summary.json
- e2e/.persona-artifacts/reports/P11.md
- e2e/.persona-artifacts/reports/P12.md
- e2e/.persona-artifacts/reports/P14.md
- e2e/.persona-artifacts/reports/P15.md
- e2e/.persona-artifacts/reports/P16.md

Do not request or inspect:

- e2e/.auth/personas/*.json
- .env files
- Supabase keys
- passwords
- cookies
- localStorage
- JWTs
- service role key
- anon key
- screenshot binaries/base64

Please return:

- executive summary
- persona-by-persona readout
- core target readout for P11, P12, P14, P15, P16
- what not to overreact to
- recommended next feedback run

Keep all findings labeled as synthetic UX inspection, not real-user validation.
```
