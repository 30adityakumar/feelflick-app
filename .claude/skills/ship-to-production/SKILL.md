---
name: ship-to-production
description: >
  Complete FeelFlick delivery end to end. Trigger when the user explicitly asks
  to ship, deploy, publish, release, merge, push, push to production, or complete
  a change through production verification.
---

# Ship to Production

The current user request is the authorization boundary. When the user explicitly asks for end-to-end delivery, do not stop for routine confirmation before branch creation, commit, push, pull request creation, merge, deployment, or verification.

Read the rules relevant to the changed files before delivery.

## Workflow

1. Inspect the working tree, current branch, remote, and intended scope.
2. Separate unrelated or unexplained local changes.
3. Implement the requested change.
4. Run validation proportionate to the risk.
5. Review the final diff for secrets, accidental files, and unrelated changes.
6. Create or use a feature branch unless direct-to-main delivery was explicitly requested and permitted.
7. Stage only intended files and commit with a clear message.
8. Push the branch and create or update a pull request.
9. Monitor required checks and correct failures caused by the change.
10. Merge after required checks pass.
11. Allow the configured production deployment to complete.
12. Verify the production application or service.
13. Report the commit, pull request, deployment, validation, and remaining risks.

## Stop conditions

Stop and report the exact blocker when:

- required validation fails and cannot be corrected safely
- unrelated changes cannot be separated
- credentials or repository permissions are unavailable
- the operation would expose secrets
- the task requires an unauthorized destructive production-data operation
- a high-risk migration lacks a credible recovery path
- the deployed result cannot be verified sufficiently

Complete all safe work before reporting a blocker. Preserve the branch and commit when possible.

## Production data and infrastructure

An explicit request to deploy application code does not automatically authorize destructive production-data changes, credential rotation, billing changes, or unrelated infrastructure work.

For remote database, Auth, RLS, secret, or infrastructure changes, follow `.claude/rules/security-and-data.md` and the task’s stated authorization.

## Output

Report:

- branch and commit SHA
- pull request URL and merge result
- checks run and outcomes
- deployment URL or status
- production verification performed
- skipped or environment-blocked validation
- remaining risks or follow-up work
