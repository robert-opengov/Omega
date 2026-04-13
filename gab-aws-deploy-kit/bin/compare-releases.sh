#!/bin/bash
# Compare branches to see what commits are pending for a release.
# Usage:
#   ./compare-releases.sh                  # compares main vs last release tag
#   ./compare-releases.sh main production  # compares two branches

source "$(dirname "$0")/../lib/_common.sh"

BRANCH_A="${1:-main}"
BRANCH_B="${2:-}"

cd "$PROJECT_ROOT"

echo ""
echo -e "${BOLD}Fetching latest from origin...${NC}"
git fetch origin --tags --quiet 2>/dev/null || true

if [ -z "$BRANCH_B" ]; then
    BRANCH_B=$(get_last_release_tag)
    if [ -z "$BRANCH_B" ]; then
        echo -e "${YELLOW}[INFO] No previous release tags found. Showing all commits on ${BRANCH_A}.${NC}"
        BRANCH_B=$(git rev-list --max-parents=0 HEAD | tail -1)
    fi
    echo -e "  Comparing: ${BOLD}${BRANCH_A}${NC} vs last release ${BOLD}${BRANCH_B}${NC}"
else
    echo -e "  Comparing: ${BOLD}${BRANCH_A}${NC} vs ${BOLD}${BRANCH_B}${NC}"
fi

AHEAD_COMMITS=$(git log --oneline "${BRANCH_B}..origin/${BRANCH_A}" 2>/dev/null || git log --oneline "${BRANCH_B}..${BRANCH_A}" 2>/dev/null || echo "")
BEHIND_COMMITS=$(git log --oneline "origin/${BRANCH_A}..${BRANCH_B}" 2>/dev/null || git log --oneline "${BRANCH_A}..${BRANCH_B}" 2>/dev/null || echo "")

AHEAD_COUNT=$(echo "$AHEAD_COMMITS" | grep -c . 2>/dev/null || echo "0")
BEHIND_COUNT=$(echo "$BEHIND_COMMITS" | grep -c . 2>/dev/null || echo "0")

if [ -z "$AHEAD_COMMITS" ]; then
    AHEAD_COUNT=0
fi
if [ -z "$BEHIND_COMMITS" ]; then
    BEHIND_COUNT=0
fi

print_header "Commits on ${BRANCH_A} NOT on ${BRANCH_B} (ahead by ${AHEAD_COUNT})"
if [ "$AHEAD_COUNT" -gt 0 ]; then
    FEAT_COMMITS=""
    FIX_COMMITS=""
    DOCS_COMMITS=""
    CHORE_COMMITS=""
    OTHER_COMMITS=""
    MERGE_COMMITS=""

    while IFS= read -r line; do
        HASH=$(echo "$line" | awk '{print $1}')
        MSG=$(echo "$line" | cut -d' ' -f2-)

        if echo "$MSG" | grep -qi "^merge pull request"; then
            MERGE_COMMITS="${MERGE_COMMITS}\n  ${DIM}${HASH}${NC} ${MSG}"
        elif echo "$MSG" | grep -qi "^feat"; then
            FEAT_COMMITS="${FEAT_COMMITS}\n  ${GREEN}${HASH}${NC} ${MSG}"
        elif echo "$MSG" | grep -qi "^fix"; then
            FIX_COMMITS="${FIX_COMMITS}\n  ${RED}${HASH}${NC} ${MSG}"
        elif echo "$MSG" | grep -qi "^docs\|^doc"; then
            DOCS_COMMITS="${DOCS_COMMITS}\n  ${BLUE}${HASH}${NC} ${MSG}"
        elif echo "$MSG" | grep -qi "^chore\|^refactor\|^style\|^ci"; then
            CHORE_COMMITS="${CHORE_COMMITS}\n  ${DIM}${HASH}${NC} ${MSG}"
        else
            OTHER_COMMITS="${OTHER_COMMITS}\n  ${HASH} ${MSG}"
        fi
    done <<< "$AHEAD_COMMITS"

    if [ -n "$FEAT_COMMITS" ]; then
        echo -e "\n  ${BOLD}Features:${NC}${FEAT_COMMITS}"
    fi
    if [ -n "$FIX_COMMITS" ]; then
        echo -e "\n  ${BOLD}Fixes:${NC}${FIX_COMMITS}"
    fi
    if [ -n "$DOCS_COMMITS" ]; then
        echo -e "\n  ${BOLD}Docs:${NC}${DOCS_COMMITS}"
    fi
    if [ -n "$CHORE_COMMITS" ]; then
        echo -e "\n  ${BOLD}Chores:${NC}${CHORE_COMMITS}"
    fi
    if [ -n "$OTHER_COMMITS" ]; then
        echo -e "\n  ${BOLD}Other:${NC}${OTHER_COMMITS}"
    fi
    if [ -n "$MERGE_COMMITS" ]; then
        echo -e "\n  ${BOLD}Merges:${NC}${MERGE_COMMITS}"
    fi
else
    echo "  (no commits)"
fi

if [ "$BEHIND_COUNT" -gt 0 ]; then
    print_header "Commits on ${BRANCH_B} NOT on ${BRANCH_A} (behind by ${BEHIND_COUNT})"
    echo "$BEHIND_COMMITS" | while IFS= read -r line; do
        echo "  $line"
    done
fi

TICKETS=$(echo "$AHEAD_COMMITS" | grep -oE "$TICKET_PATTERN" 2>/dev/null | sort -u)
if [ -n "$TICKETS" ]; then
    print_header "Tickets for CM"
    echo "$TICKETS" | while IFS= read -r ticket; do
        echo "  $ticket"
    done
fi

PR_NUMBERS=$(echo "$AHEAD_COMMITS" | grep -oE '#[0-9]+' 2>/dev/null | sort -u)
if [ -n "$PR_NUMBERS" ]; then
    print_header "Pull Requests"
    echo "$PR_NUMBERS" | while IFS= read -r pr; do
        echo "  $pr"
    done
fi

echo ""
echo -e "${DIM}Total: ${AHEAD_COUNT} commits ahead, ${BEHIND_COUNT} commits behind${NC}"
echo ""
