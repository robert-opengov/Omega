#!/bin/bash
# REMOTE PHASE: Trigger AWS CodeBuild to build the production image.
# Reads metadata from the latest release:prepare output or accepts a release tag as argument.

source "$(dirname "$0")/../lib/_common.sh"

ensure_aws_auth

cd "$PROJECT_ROOT"

# ── Determine release tag ────────────────────────────────────────────────────
RELEASE_TAG="${1:-}"

if [ -z "$RELEASE_TAG" ]; then
    LATEST_RELEASE_DIR=$(ls -td "$RELEASES_DIR"/release-* 2>/dev/null | head -1)
    if [ -n "$LATEST_RELEASE_DIR" ] && [ -f "$LATEST_RELEASE_DIR/.metadata" ]; then
        # shellcheck source=/dev/null
        source "$LATEST_RELEASE_DIR/.metadata"
        echo -e "  Using latest prepared release: ${BOLD}${RELEASE_TAG}${NC}"
    else
        print_error "No release tag provided and no prepared release found."
        echo "  Run release-prepare.sh first, or provide a tag:"
        echo "    release-build.sh release-1.0.0"
        exit 1
    fi
fi

RELEASE_DIR="$RELEASES_DIR/$RELEASE_TAG"
if [ -f "$RELEASE_DIR/.metadata" ]; then
    # shellcheck source=/dev/null
    source "$RELEASE_DIR/.metadata"
else
    COMMIT_SHA=$(git rev-parse HEAD)
    COMMIT_SHA_SHORT=$(git rev-parse --short HEAD)
fi

print_header "Remote Build (CodeBuild)"
echo -e "  Release:  ${BOLD}${RELEASE_TAG}${NC}"
echo -e "  Commit:   ${COMMIT_SHA_SHORT} (${COMMIT_SHA})"
echo -e "  Project:  ${CODEBUILD_PROJECT}"
echo ""

# ── Verify commit is pushed ──────────────────────────────────────────────────
print_step "Verifying commit is pushed to remote..."
if ! git branch -r --contains "$COMMIT_SHA" 2>/dev/null | grep -q .; then
    print_error "Commit ${COMMIT_SHA_SHORT} is not pushed to remote."
    echo "  Push your changes first: git push origin main"
    exit 1
fi
print_ok "Commit exists on remote"

# ── Resolve APP_DIR relative to repo root for CodeBuild ─────────────────────
# CodeBuild clones the repo; APP_DIR needs to be relative to repo root
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo "$PROJECT_ROOT")
APP_DIR_RELATIVE=$(python3 -c "import os; print(os.path.relpath('${APP_DIR}', '${REPO_ROOT}'))")

# ── Load build args for CodeBuild env overrides ─────────────────────────────
BUILD_ARGS_FILE="${KIT_DIR}/deploy-build-args"
CB_BUILD_ARG_OVERRIDES=""
if [ -f "$BUILD_ARGS_FILE" ]; then
    while IFS='=' read -r key val; do
        [[ -z "$key" || "$key" =~ ^[[:space:]]*# ]] && continue
        key=$(echo "$key" | tr -d '[:space:]')
        CB_BUILD_ARG_OVERRIDES+=" \"name=${key},value=${val},type=PLAINTEXT\""
    done < "$BUILD_ARGS_FILE"
fi

# ── Trigger CodeBuild ────────────────────────────────────────────────────────
print_step "Triggering CodeBuild..."

BUILD_RESPONSE=$(eval aws codebuild start-build \
    --project-name "$CODEBUILD_PROJECT" \
    --source-version "$COMMIT_SHA" \
    --environment-variables-override \
        "name=RELEASE_TAG,value=${RELEASE_TAG},type=PLAINTEXT" \
        "name=AWS_ACCOUNT_ID,value=${AWS_ACCOUNT_ID},type=PLAINTEXT" \
        "name=APP_NAME,value=${APP_NAME},type=PLAINTEXT" \
        "name=APP_DIR,value=${APP_DIR_RELATIVE},type=PLAINTEXT" \
        ${CB_BUILD_ARG_OVERRIDES} \
    --query "'build.id'" \
    --output text)

BUILD_ID="$BUILD_RESPONSE"
BUILD_URL_ID=$(echo "$BUILD_ID" | sed 's/:/%3A/g')
CONSOLE_URL="https://${AWS_REGION}.console.aws.amazon.com/codesuite/codebuild/${AWS_ACCOUNT_ID}/projects/${CODEBUILD_PROJECT}/build/${BUILD_URL_ID}"

echo -e "  Build ID: ${BOLD}${BUILD_ID}${NC}"
echo -e "  Console:  ${CYAN}${CONSOLE_URL}${NC}"
echo ""

# ── Poll for completion ──────────────────────────────────────────────────────
print_step "Waiting for build to complete..."
echo -e "  ${DIM}(polling every 15s)${NC}"
echo ""

PREV_PHASE=""
while true; do
    BUILD_INFO=$(aws codebuild batch-get-builds --ids "$BUILD_ID" --query 'builds[0]' --output json)

    STATUS=$(echo "$BUILD_INFO" | python3 -c "import sys, json; print(json.load(sys.stdin)['buildStatus'])")
    CURRENT_PHASE=$(echo "$BUILD_INFO" | python3 -c "import sys, json; print(json.load(sys.stdin).get('currentPhase', 'UNKNOWN'))")

    if [ "$CURRENT_PHASE" != "$PREV_PHASE" ]; then
        echo -e "  Phase: ${CYAN}${CURRENT_PHASE}${NC} (status: ${STATUS})"
        PREV_PHASE="$CURRENT_PHASE"
    fi

    case "$STATUS" in
        SUCCEEDED)
            echo ""
            print_ok "CodeBuild completed successfully!"
            break
            ;;
        FAILED|FAULT|TIMED_OUT|STOPPED)
            echo ""
            print_error "CodeBuild failed with status: ${STATUS}"
            echo "  View logs: aws codebuild batch-get-builds --ids $BUILD_ID"
            LOG_URL=$(echo "$BUILD_INFO" | python3 -c "import sys, json; d=json.load(sys.stdin).get('logs',{}); print(d.get('deepLink',''))" 2>/dev/null || echo "")
            if [ -n "$LOG_URL" ]; then
                echo "  CloudWatch logs: $LOG_URL"
            fi
            exit 1
            ;;
        *)
            sleep 15
            ;;
    esac
done

# ── Download reports from S3 ─────────────────────────────────────────────────
print_header "Downloading Build Reports"
mkdir -p "$RELEASE_DIR"

aws s3 cp "s3://${S3_BUCKET}/releases/${RELEASE_TAG}/" "$RELEASE_DIR/" --recursive --quiet 2>/dev/null || true
print_ok "Reports downloaded to releases/${RELEASE_TAG}/"

# ── Update release notes ─────────────────────────────────────────────────────
if [ -f "$RELEASE_DIR/release-notes.md" ]; then
    cat >> "$RELEASE_DIR/release-notes.md" <<CB_INFO

## Production Build (CodeBuild)

**Build ID**: ${BUILD_ID}
**Status**: SUCCEEDED
**Built at**: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
**Image**: ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}:${RELEASE_TAG}

> This image was built in a controlled AWS CodeBuild environment
> from git commit ${COMMIT_SHA}. It is the trusted production image.
CB_INFO
fi

aws s3 cp "$RELEASE_DIR/release-notes.md" "s3://${S3_BUCKET}/releases/${RELEASE_TAG}/release-notes.md" --quiet 2>/dev/null || true

# ── Git tag ──────────────────────────────────────────────────────────────────
print_step "Creating git tag..."
if ! git tag -l "$RELEASE_TAG" | grep -q .; then
    git tag -a "$RELEASE_TAG" "$COMMIT_SHA" -m "Release ${RELEASE_TAG} - built by CodeBuild ${BUILD_ID}"
    git push origin "$RELEASE_TAG" 2>/dev/null || print_warn "Could not push tag to remote. Push manually: git push origin ${RELEASE_TAG}"
    print_ok "Git tag created: ${RELEASE_TAG}"
else
    print_warn "Git tag ${RELEASE_TAG} already exists"
fi

# ── Summary ──────────────────────────────────────────────────────────────────
ECR_URI="$(get_ecr_uri)"

print_header "Release Build Complete"
echo ""
echo -e "  Release: ${BOLD}${RELEASE_TAG}${NC}"
echo -e "  Image:   ${ECR_URI}:${RELEASE_TAG}"
echo -e "  Build:   ${BUILD_ID}"
echo ""
echo -e "  Artifacts: releases/${RELEASE_TAG}/"
echo -e "  S3:        s3://${S3_BUCKET}/releases/${RELEASE_TAG}/"
echo ""
echo -e "  ${GREEN}Next step:${NC} Review the release artifacts, create your CM ticket, then:"
echo -e "    ${BOLD}deploy.sh ${RELEASE_TAG}${NC}"
echo ""
