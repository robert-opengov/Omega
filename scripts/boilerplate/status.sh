#!/usr/bin/env bash
set -euo pipefail

REMOTE_NAME="boilerplate"

if ! git remote | grep -q "^${REMOTE_NAME}$"; then
  echo "✗ Remote '${REMOTE_NAME}' not found. Run: npm run boilerplate:init"
  exit 1
fi

git fetch "${REMOTE_NAME}" --quiet

BEHIND=$(git rev-list --count HEAD.."${REMOTE_NAME}"/main 2>/dev/null || echo 0)
AHEAD=$(git rev-list --count "${REMOTE_NAME}"/main..HEAD 2>/dev/null || echo 0)

echo "Your repo:    ${AHEAD} commit(s) ahead of the boilerplate"
echo "Boilerplate:  ${BEHIND} new commit(s) since last sync"

if [ "${BEHIND}" -gt 0 ]; then
  echo ""
  echo "New commits in the boilerplate:"
  git log --oneline HEAD.."${REMOTE_NAME}"/main | head -20
  echo ""
  echo "Run 'npm run boilerplate:sync' to pull them in."
else
  echo ""
  echo "✓ Already up to date."
fi
