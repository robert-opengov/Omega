#!/bin/bash
# Rollback to a previous release.
# Lists available ECR images and lets you pick one.

source "$(dirname "$0")/../lib/_common.sh"
source "$LIB_DIR/_task-def.sh"

ensure_aws_auth

print_header "Rollback"

CURRENT_RELEASE=$(get_current_release)
echo -e "  Currently deployed: ${BOLD}${CURRENT_RELEASE}${NC}"
echo ""

# ── List available releases ──────────────────────────────────────────────────
print_step "Fetching available releases from ECR..."

IMAGES=$(aws ecr describe-images \
    --repository-name "$ECR_REPO" \
    --query 'imageDetails[?imageTags]|sort_by(@, &imagePushedAt)|reverse(@)[].{tag:imageTags[0],pushed:imagePushedAt}' \
    --output json 2>/dev/null)

RELEASE_TAGS=$(echo "$IMAGES" | python3 -c "
import sys, json
images = json.load(sys.stdin)
for img in images:
    tag = img['tag']
    if tag.startswith('release-') and tag != '${CURRENT_RELEASE}':
        pushed = img['pushed'][:19]
        print(f'{tag}|{pushed}')
" 2>/dev/null || echo "")

if [ -z "$RELEASE_TAGS" ]; then
    print_error "No release images found in ECR."
    exit 1
fi

echo ""
echo -e "  ${BOLD}Available releases:${NC}"
echo ""
IDX=1
declare -a TAG_ARRAY
while IFS='|' read -r tag pushed; do
    TAG_ARRAY+=("$tag")
    MARKER=""
    if [ "$tag" = "$CURRENT_RELEASE" ]; then
        MARKER=" ${GREEN}(current)${NC}"
    fi
    printf "    %2d) %-30s %s%b\n" "$IDX" "$tag" "$pushed" "$MARKER"
    IDX=$((IDX + 1))
done <<< "$RELEASE_TAGS"

echo ""
echo -n "  Select release to rollback to (number): "
read -r SELECTION

if [ -z "$SELECTION" ] || [ "$SELECTION" -lt 1 ] || [ "$SELECTION" -gt "${#TAG_ARRAY[@]}" ] 2>/dev/null; then
    print_error "Invalid selection."
    exit 1
fi

TARGET_TAG="${TAG_ARRAY[$((SELECTION - 1))]}"

if [ "$TARGET_TAG" = "$CURRENT_RELEASE" ]; then
    print_warn "Selected release is already deployed."
    exit 0
fi

echo ""
echo -e "  Rolling back: ${BOLD}${CURRENT_RELEASE}${NC} -> ${BOLD}${TARGET_TAG}${NC}"

# ── Show commit diff if possible ─────────────────────────────────────────────
if git tag -l "$TARGET_TAG" | grep -q . && git tag -l "$CURRENT_RELEASE" | grep -q .; then
    DIFF_COUNT=$(git log --oneline "${TARGET_TAG}..${CURRENT_RELEASE}" 2>/dev/null | wc -l | tr -d ' ')
    if [ "$DIFF_COUNT" -gt 0 ]; then
        echo -e "  ${DIM}Rolling back ${DIFF_COUNT} commits${NC}"
    fi
fi

confirm_action "Rollback to ${TARGET_TAG}" "${ECS_SERVICE}"

# ── Deploy the rollback target using shared functions ────────────────────────
NEW_TASK_DEF_ARN=$(update_task_definition "$TARGET_TAG")
deploy_task "$NEW_TASK_DEF_ARN"

# ── Update CURRENT_RELEASE tag ───────────────────────────────────────────────
tag_current_release "$TARGET_TAG"

# ── Log rollback event ───────────────────────────────────────────────────────
log_deploy_event "rollback" "$TARGET_TAG" "$CURRENT_RELEASE" "$NEW_TASK_DEF_ARN"

# ── Summary ──────────────────────────────────────────────────────────────────
print_header "Rollback Complete"
echo ""
echo -e "  From:  ${CURRENT_RELEASE}"
echo -e "  To:    ${GREEN}${BOLD}${TARGET_TAG}${NC}"
echo ""
echo -e "  Check status: ${BOLD}status.sh${NC}"
echo ""
