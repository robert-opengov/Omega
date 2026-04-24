#!/usr/bin/env bash
set -euo pipefail

REMOTE_NAME="boilerplate"
REMOTE_URL="https://github.com/OpenGov/gab-boilerplate.git"

if git remote | grep -q "^${REMOTE_NAME}$"; then
  echo "✓ Remote '${REMOTE_NAME}' already exists ($(git remote get-url "${REMOTE_NAME}"))"
else
  git remote add "${REMOTE_NAME}" "${REMOTE_URL}"
  echo "✓ Remote '${REMOTE_NAME}' added → ${REMOTE_URL}"
fi

echo "  Fetching latest from ${REMOTE_NAME}..."
git fetch "${REMOTE_NAME}" --quiet

BEHIND=$(git rev-list --count HEAD.."${REMOTE_NAME}"/main 2>/dev/null || echo "?")

echo ""
echo "Done. You are ${BEHIND} commit(s) behind the boilerplate."
echo ""
echo "Next steps:"
echo "  npm run boilerplate:status   – see what's new"
echo "  npm run boilerplate:diff     – preview incoming changes"
echo "  npm run boilerplate:sync     – merge updates into your branch"
