#!/bin/bash
# List all releases from git tags, ECR images, and S3 artifacts.

source "$(dirname "$0")/../lib/_common.sh"

ensure_aws_auth

cd "$PROJECT_ROOT"

print_header "Available Releases"

CURRENT_RELEASE=$(get_current_release)

GIT_TAGS=$(git tag -l 'release-*' --sort=-version:refname 2>/dev/null)

if [ -z "$GIT_TAGS" ]; then
    echo "  No releases found."
    echo ""
    echo "  Create one with: release-prepare.sh"
    exit 0
fi

ECR_IMAGES=$(aws ecr list-images \
    --repository-name "$ECR_REPO" \
    --query 'imageIds[?imageTag!=`null`].imageTag' \
    --output text 2>/dev/null | tr '\t' '\n' | grep '^release-' | sort -rV || echo "")

printf "  %-30s %-12s %-10s %-10s\n" "RELEASE" "DATE" "IN ECR" "STATUS"
printf "  %-30s %-12s %-10s %-10s\n" "-------" "----" "------" "------"

echo "$GIT_TAGS" | while IFS= read -r tag; do
    TAG_DATE=$(git log -1 --format="%ci" "$tag" 2>/dev/null | cut -d' ' -f1)

    IN_ECR="no"
    if echo "$ECR_IMAGES" | grep -qx "$tag" 2>/dev/null; then
        IN_ECR="yes"
    fi

    STATUS=""
    if [ "$tag" = "$CURRENT_RELEASE" ]; then
        STATUS="DEPLOYED"
    fi

    if [ "$STATUS" = "DEPLOYED" ]; then
        printf "  ${GREEN}%-30s %-12s %-10s %-10s${NC}\n" "$tag" "$TAG_DATE" "$IN_ECR" "$STATUS"
    elif [ "$IN_ECR" = "yes" ]; then
        printf "  %-30s %-12s %-10s %-10s\n" "$tag" "$TAG_DATE" "$IN_ECR" "$STATUS"
    else
        printf "  ${DIM}%-30s %-12s %-10s %-10s${NC}\n" "$tag" "$TAG_DATE" "$IN_ECR" "$STATUS"
    fi
done

echo ""
echo -e "  Current: ${BOLD}${CURRENT_RELEASE}${NC}"
echo ""
