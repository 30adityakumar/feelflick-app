# F10B — Private Preview Wave 1 Tracker (TEMPLATE)

> **Blank template — do NOT commit real tester PII to the repo.** Use **aliases** here
> (e.g. T1, T2, T3). Keep names, emails, and any personal info in a **private**
> spreadsheet/doc outside the repo. Copy this table into that private doc and fill it
> there; this file stays blank as the canonical schema.
>
> Pairs with the [Wave 1 operations doc](private-preview-wave-1-f10b.md). One row per tester.

**Wave:** 1 (2–3 testers) · **Window start:** `__________` · **Engine:** frozen `2.17`

---

## Tracker

| Field | T1 | T2 | T3 |
|---|---|---|---|
| Alias (no real name) | | | |
| Cohort tier (cold / warm) | | | |
| Device / browser | | | |
| Invited (date) | | | |
| Accepted? (y/n) | | | |
| Signed in? (y/n + date) | | | |
| Onboarding completed? (y/n) | | | |
| First "Tonight" pick seen? (y/n) | | | |
| Saw "Why this pick"? (y/n) | | | |
| Opened Film File? (y/n) | | | |
| Saved / Skipped / Watched? (which) | | | |
| Came back a 2nd night? (y/n) | | | |
| Feedback received? (y/n + date) | | | |
| Issue category (P0/P1/P2/insight/rec-quality/none) | | | |
| Follow-up needed? (what) | | | |
| Notes | | | |

## Per-tester onboarding smoke (tick as confirmed — see ops doc §5)

| Smoke step | T1 | T2 | T3 |
|---|---|---|---|
| Google sign-in works | | | |
| Onboarding completes → /home | | | |
| Tonight pick renders | | | |
| "Why this pick" present | | | |
| Film File (/movie/:id) renders | | | |
| Save works | | | |
| Skip works | | | |
| Profile / DNA renders (honest) | | | |
| No crash in Sentry for their session | | | |

## Daily log (append rows; aliases only)

| Date | Sentry new errors? | New CSP violations? | Prod 200? | CI green? | Capture trend (windowed) | Feedback items triaged | Notes |
|---|---|---|---|---|---|---|---|
| | | | | | | | |

## Privacy

- **No real names / emails / PII in this file or any committed doc.** Aliases only.
- Real identities + contact info → a private doc outside the repo.
- A tester can ask for their data to be removed after the preview — honor it.
