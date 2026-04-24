#!/usr/bin/env bash
set -euo pipefail

REMOTE_NAME="boilerplate"

if ! git remote | grep -q "^${REMOTE_NAME}$"; then
  echo "✗ Remote '${REMOTE_NAME}' not found. Run: npm run boilerplate:init"
  exit 1
fi

if ! git diff-index --quiet HEAD -- 2>/dev/null; then
  echo "✗ You have uncommitted changes. Commit or stash them first."
  exit 1
fi

git fetch "${REMOTE_NAME}" --quiet

BEHIND=$(git rev-list --count HEAD.."${REMOTE_NAME}"/main 2>/dev/null || echo 0)

if [ "${BEHIND}" -eq 0 ]; then
  echo "✓ Already up to date — nothing to sync."
  exit 0
fi

echo "Merging ${BEHIND} commit(s) from the boilerplate..."
git merge "${REMOTE_NAME}"/main --no-ff -m "chore: sync boilerplate (${BEHIND} commits)"

echo ""
echo "✓ Sync complete."
echo ""
echo "Next steps:"
echo "  1. Run 'npm install' in case dependencies changed"
echo "  2. Run 'npm run dev' and verify everything works"
echo "  3. Commit any conflict resolutions if needed"
