#!/bin/bash
# Deploy a specific release to ECS Fargate.
# Usage: ./deploy.sh release-1.0.0

source "$(dirname "$0")/../lib/_common.sh"
source "$LIB_DIR/_task-def.sh"

RELEASE_TAG="${1:-}"

if [ -z "$RELEASE_TAG" ]; then
    print_error "Release tag required."
    echo "  Usage: deploy.sh release-1.0.0"
    echo ""
    echo "  Available releases:"
    bash "$(dirname "$0")/release-list.sh" 2>/dev/null || echo "  (run release-list.sh to see releases)"
    exit 1
fi

ensure_aws_auth

ECR_URI="$(get_ecr_uri)"

# ── Verify image exists in ECR ───────────────────────────────────────────────
print_header "Deploy: ${RELEASE_TAG}"

print_step "Verifying image in ECR..."
IMAGE_EXISTS=$(aws ecr describe-images \
    --repository-name "$ECR_REPO" \
    --image-ids "imageTag=${RELEASE_TAG}" \
    --query 'imageDetails[0].imageTags' \
    --output text 2>/dev/null || echo "")

if [ -z "$IMAGE_EXISTS" ]; then
    print_error "Image ${ECR_REPO}:${RELEASE_TAG} not found in ECR."
    echo "  Make sure you ran release-build.sh first."
    exit 1
fi
print_ok "Image found in ECR"

# ── Show release info ────────────────────────────────────────────────────────
CURRENT_RELEASE=$(get_current_release)
RELEASE_DIR="$RELEASES_DIR/$RELEASE_TAG"

echo ""
echo -e "  From:  ${BOLD}${CURRENT_RELEASE}${NC}"
echo -e "  To:    ${BOLD}${RELEASE_TAG}${NC}"
echo -e "  Image: ${ECR_URI}:${RELEASE_TAG}"

if [ -f "$RELEASE_DIR/release-notes.md" ]; then
    echo ""
    echo -e "  ${DIM}--- Release Notes (summary) ---${NC}"
    head -20 "$RELEASE_DIR/release-notes.md" | sed 's/^/  /'
    echo -e "  ${DIM}---${NC}"
fi

# ── Confirm ──────────────────────────────────────────────────────────────────
confirm_action "Deploy ${RELEASE_TAG} to ECS" "${ECS_SERVICE}"

# ── Update task definition and deploy ────────────────────────────────────────
NEW_TASK_DEF_ARN=$(update_task_definition "$RELEASE_TAG")
deploy_task "$NEW_TASK_DEF_ARN"

# ── Tag current release in ECR ───────────────────────────────────────────────
tag_current_release "$RELEASE_TAG"

# ── Log deploy event to S3 ──────────────────────────────────────────────────
log_deploy_event "deploy" "$RELEASE_TAG" "$CURRENT_RELEASE" "$NEW_TASK_DEF_ARN"

# ── Summary ──────────────────────────────────────────────────────────────────
print_header "Deploy Complete"
echo ""
echo -e "  Release:  ${GREEN}${BOLD}${RELEASE_TAG}${NC}"
echo -e "  Previous: ${CURRENT_RELEASE}"
echo -e "  Image:    ${ECR_URI}:${RELEASE_TAG}"
echo ""
echo -e "  Check status: ${BOLD}status.sh${NC}"
echo -e "  View logs:    ${BOLD}logs.sh${NC}"
echo -e "  Rollback:     ${BOLD}rollback.sh${NC}"
echo ""
