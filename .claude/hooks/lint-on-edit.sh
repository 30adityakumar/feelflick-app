#!/usr/bin/env bash
# Advisory ESLint on edited src JS/JSX files (PostToolUse: Edit|Write).
# Non-blocking: always exits 0. If ESLint reports problems, the findings are
# surfaced back to the model via additionalContext so they get fixed before commit.
set -u

# Read the edited file path from the hook's stdin JSON.
f="$(jq -r '.tool_input.file_path // empty' 2>/dev/null)"

# Only lint JS/JSX under src/. Skip everything else silently.
case "$f" in
  *src/*.js|*src/*.jsx) ;;
  *) exit 0 ;;
esac
[ -f "$f" ] || exit 0

# Run from project root (two levels up from .claude/hooks/) so the flat
# eslint.config.js resolves. Use the locally-installed eslint, no network.
root="$(cd "$(dirname "$0")/../.." && pwd)"
out="$(cd "$root" && npx --no-install eslint "$f" 2>&1)"

# Clean run prints nothing -> stay silent. Any output (warnings or errors) ->
# surface it back to the model, but never block the workflow (always exit 0).
if [ -n "$out" ]; then
  ctx="$(printf 'ESLint findings in %s (advisory — fix before commit):\n%s' "$f" "$out" | jq -Rs .)"
  printf '{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":%s}}\n' "$ctx"
fi
exit 0
