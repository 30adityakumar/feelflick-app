# People — private-beta safety decision record (F8.4)

Status: current. Scope: the People taste-discovery surface during **private beta** (a small, trusted
cohort). This records what relationship + safety affordances exist, what is deliberately deferred, and
why. It is **not** a claim that People is safe for unrestricted public social use.

## Relationship model

- **Follow is one-way, explicit, and revocable.** It is persisted in `public.user_follows`
  (participant-only RLS; INSERT/DELETE owner-scoped to the follower). Following someone is not
  friendship, not mutual matching, and implies no endorsement or agreement.
- **No relationship state is confirmed until the database write succeeds** (F8.4). The UI never
  optimistically shows "Following"; it reads `Follow → Following…/Unfollowing… → Following/Follow`
  from the settled result, announces each settlement once in a polite live region, and on failure
  keeps the prior state with retry-capable copy. A duplicate-key (`23505`) follow is treated as
  idempotent success.
- **Self-follow is impossible** — the signed-in user is excluded from candidate sets (similarity rows
  are always pairs with the *other* user; suggested/FOF filter `!== userId`) and the action hook
  rejects a self target before any write.

## Hide suggestion — what it is and is NOT

People offers a quiet, tertiary **Hide** action on non-followed discovery cards.

- **It is NOT a block.** It does not change the other person's account, does not notify them, does not
  affect their discoverability setting, and exposes no social signal to them or anyone else.
- It only removes that suggestion from the **caller's current People session** and announces
  "Hidden from your suggestions."
- It does **not** unfollow an already-followed person, and is not shown on followed cards or on the
  signed-in user.
- It changes no similarity value and no persisted relationship state. Hiding is the *only* permitted
  session card-order change.

### Persistence scope (honest limitation)

**Hide is session-local.** Hidden ids live in React state for the current People session only; they
are **not** persisted to a database and reset on reload. No new table or migration was added for this
phase. Durable, cross-session suggestion controls are **deferred** — a persistent "don't suggest this
person again" preference is future work and would require a deliberate schema + ranking-contract
decision.

## Deferred safety controls (required before unrestricted public rollout)

The following are **not** implemented and are **required before any open/public rollout**, because at
public scale People can surface *strangers*, supports *following*, and carries *user-generated text*
(profile names, list titles/notes):

- **Block** — prevent a user from following or seeing you; mutual visibility cut-off.
- **Report user / Report content** — abuse escalation for profiles, list text, etc.
- **Mute** — suppress a user without blocking.
- **Remove follower** — eject an existing follower.
- **Disable incoming follows / private mode** — opt out of being followed at all.
- A real moderation workflow + audit logging behind these controls.

For the **private beta** (small, trusted cohort, explicit opt-in discovery), the session-local Hide
plus the existing opt-in/opt-out discovery control is an acceptable minimum. This is a deliberate,
scoped decision — not a claim of public-scale safety.

## Privacy + consent boundary (unchanged by F8.4)

- No cross-user behavioral data is reopened: raw history, ratings, reviews, and the full follow graph
  remain closed (F8.2). Cross-user identity comes only from the narrow authenticated identity/search
  RPCs (id/name/avatar), and taste comes only from the opt-in least-data fingerprint RPC.
- **RLS is access control — not consent and not moderation.** Being technically able to read a row is
  not the same as a user consenting to social exposure or to being contacted.
- Users control whether they appear in taste-match discovery via **Account → "Appear in taste-match
  discovery"** (explicit opt-in as of F8.2). Turning it off removes them from future discovery
  derivations.

## Summary

For private beta: Follow is honest and settled, self-follow is impossible, and an unwanted suggestion
can be hidden for the session. Block, Report, Mute, and Remove-follower — and durable Hide — are
deliberately deferred and are prerequisites for unrestricted public social use.
