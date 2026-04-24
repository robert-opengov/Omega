#!/usr/bin/env bash
set -euo pipefail

REMOTE_NAME="boilerplate"

if ! git remote | grep -q "^${REMOTE_NAME}$"; then
  echo "✗ Remote '${REMOTE_NAME}' not found. Run: npm run boilerplate:init"
  exit 1
fi

git fetch "${REMOTE_NAME}" --quiet

BEHIND=$(git rev-list --count HEAD.."${REMOTE_NAME}"/main 2>/dev/null || echo 0)

if [ "${BEHIND}" -eq 0 ]; then
  echo "✓ Already up to date — nothing to preview."
  exit 0
fi

echo "Showing ${BEHIND} incoming commit(s) from the boilerplate:"
echo ""
git log HEAD.."${REMOTE_NAME}"/main --stat
