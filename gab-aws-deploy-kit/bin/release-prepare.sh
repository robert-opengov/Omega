#!/bin/bash
# LOCAL PHASE: Build Docker image locally, run security scans, generate release notes.
# Optionally pushes to ECR for local CLI workflow (no CodeBuild needed).

source "$(dirname "$0")/../lib/_common.sh"

require_cmd docker

cd "$PROJECT_ROOT"

print_header "Release Preparation (Local Phase)"

# ── Determine release tag ────────────────────────────────────────────────────
LAST_TAG=$(get_last_release_tag)
if [ -n "$LAST_TAG" ]; then
    echo -e "  Last release: ${BOLD}${LAST_TAG}${NC}"
else
    echo -e "  ${DIM}No previous releases found.${NC}"
fi

TODAY=$(date +%Y-%m-%d)
EXISTING_TODAY=$(git tag -l "release-${TODAY}-v*" | wc -l | tr -d ' ')
SUGGESTED_TAG="release-${TODAY}-v$((EXISTING_TODAY + 1))"

echo ""
echo -e "  Suggested tag: ${GREEN}${SUGGESTED_TAG}${NC}"
echo -e "  ${DIM}You can also use semver like: release-1.0.0${NC}"
echo ""
echo -n "  Release tag (Enter for suggested): "
read -r RELEASE_TAG
RELEASE_TAG="${RELEASE_TAG:-$SUGGESTED_TAG}"

if git tag -l "$RELEASE_TAG" | grep -q .; then
    print_error "Tag $RELEASE_TAG already exists."
    exit 1
fi

# ── Compare commits ──────────────────────────────────────────────────────────
print_header "Commits in this release"

COMPARE_BASE="${LAST_TAG:-$(git rev-list --max-parents=0 HEAD | tail -1)}"
COMMITS=$(git log --oneline "${COMPARE_BASE}..HEAD" 2>/dev/null || git log --oneline HEAD 2>/dev/null)
COMMIT_COUNT=$(echo "$COMMITS" | grep -c . 2>/dev/null || echo "0")

if [ -z "$COMMITS" ]; then
    COMMIT_COUNT=0
fi

echo "$COMMITS" | head -20
if [ "$COMMIT_COUNT" -gt 20 ]; then
    echo -e "  ${DIM}... and $((COMMIT_COUNT - 20)) more${NC}"
fi
echo ""
echo -e "  Total: ${BOLD}${COMMIT_COUNT} commits${NC}"

# ── Create release directory ─────────────────────────────────────────────────
RELEASE_DIR="$RELEASES_DIR/$RELEASE_TAG"
mkdir -p "$RELEASE_DIR"

echo "$COMMITS" > "$RELEASE_DIR/commits.txt"

# ── Load build args (NEXT_PUBLIC_* vars baked at build time) ─────────────────
BUILD_ARGS_FILE="${KIT_DIR}/deploy-build-args"
BUILD_ARGS=()
if [ -f "$BUILD_ARGS_FILE" ]; then
    while IFS= read -r line; do
        [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
        BUILD_ARGS+=("--build-arg" "$line")
    done < "$BUILD_ARGS_FILE"
    print_ok "Loaded build args from deploy-build-args"
else
    print_warn "No deploy-build-args file found. NEXT_PUBLIC_* vars will be empty in the build."
    echo "  Copy the example: cp deploy-build-args.example deploy-build-args"
fi

# ── Local Docker build ───────────────────────────────────────────────────────
print_header "Docker Build (local test)"
print_step "Building image..."
docker build --platform linux/amd64 "${BUILD_ARGS[@]}" -t "${APP_NAME}:${RELEASE_TAG}" -t "${APP_NAME}:local-test" "$APP_DIR"
print_ok "Docker image built: ${APP_NAME}:${RELEASE_TAG}"

# ── Security Scans ───────────────────────────────────────────────────────────
print_header "Security Scans"
SCAN_PASS=true

print_step "Running npm audit..."
cd "$APP_DIR"
npm audit --json > "$RELEASE_DIR/audit-report.json" 2>&1 || true
if npm audit --audit-level=high > /dev/null 2>&1; then
    print_ok "npm audit: PASS"
    NPM_STATUS="PASS"
else
    print_warn "npm audit: HIGH/CRITICAL vulnerabilities found"
    NPM_STATUS="WARN"
    SCAN_PASS=false
fi
cd "$PROJECT_ROOT"

print_step "Running ESLint..."
cd "$APP_DIR"
if command -v npx &> /dev/null; then
    npx eslint --format json -o "$RELEASE_DIR/eslint-report.json" . 2>&1 || true
    if npx eslint . > /dev/null 2>&1; then
        print_ok "ESLint: PASS"
        ESLINT_STATUS="PASS"
    else
        print_warn "ESLint: issues found"
        ESLINT_STATUS="WARN"
    fi
else
    print_warn "npx not found in PATH. Skipping ESLint."
    ESLINT_STATUS="SKIPPED"
fi
cd "$PROJECT_ROOT"

if command -v trivy &> /dev/null; then
    print_step "Running Trivy scan..."
    trivy image --format json --output "$RELEASE_DIR/trivy-report.json" "${APP_NAME}:${RELEASE_TAG}" 2>/dev/null || true
    if trivy image --severity CRITICAL,HIGH --exit-code 1 "${APP_NAME}:${RELEASE_TAG}" > /dev/null 2>&1; then
        print_ok "Trivy: PASS"
        TRIVY_STATUS="PASS"
    else
        print_warn "Trivy: CRITICAL/HIGH vulnerabilities found"
        TRIVY_STATUS="WARN"
        SCAN_PASS=false
    fi
else
    print_warn "Trivy not installed. Skipping container scan."
    echo -e "  ${DIM}Install: brew install trivy${NC}"
    echo -e "  ${DIM}Trusted Trivy scan will run in CodeBuild (release-build.sh).${NC}"
    TRIVY_STATUS="SKIPPED"
fi

# ── Generate HTML Scan Report ─────────────────────────────────────────────────
print_header "Generating HTML Scan Report"
SCAN_REPORT_SCRIPT="${KIT_DIR}/bin/generate-scan-report.sh"
if [ -f "$SCAN_REPORT_SCRIPT" ]; then
    bash "$SCAN_REPORT_SCRIPT" "$RELEASE_DIR" "$RELEASE_TAG" "$NPM_STATUS" "$ESLINT_STATUS" "$TRIVY_STATUS"
    REPORT_PATH="$RELEASE_DIR/scan-report.html"
    print_ok "scan-report.html generated"
else
    print_warn "generate-scan-report.sh not found. Skipping HTML report."
    REPORT_PATH=""
fi
if [ -n "$REPORT_PATH" ] && [ -f "$REPORT_PATH" ]; then
    echo ""
    echo -e "  ${BOLD}Report:${NC} file://${REPORT_PATH}"
    echo ""
    echo -n "  Open in browser? (Y/n): "
    read -r OPEN_REPORT
    if [ "$OPEN_REPORT" != "n" ] && [ "$OPEN_REPORT" != "N" ]; then
        open "$REPORT_PATH" 2>/dev/null || xdg-open "$REPORT_PATH" 2>/dev/null || echo "  Open manually: file://${REPORT_PATH}"
    fi
fi

# ── Generate Release Notes ───────────────────────────────────────────────────
print_header "Generating Release Notes"

CURRENT_SHA=$(git rev-parse HEAD)
SHORT_SHA=$(git rev-parse --short HEAD)
PREPARER=$(whoami)
TICKETS=$(echo "$COMMITS" | grep -oE "$TICKET_PATTERN" 2>/dev/null | sort -u || echo "")

cat > "$RELEASE_DIR/release-notes.md" <<NOTES
# Release: ${RELEASE_TAG}

**Date**: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
**Prepared by**: ${PREPARER}
**Commit**: ${CURRENT_SHA} (${SHORT_SHA})
**Previous Release**: ${LAST_TAG:-"(first release)"}
**Status**: Prepared locally (pending CodeBuild production build)

## Commits (${COMMIT_COUNT})

$(echo "$COMMITS" | sed 's/^/- /')

NOTES

if [ -n "$TICKETS" ]; then
    cat >> "$RELEASE_DIR/release-notes.md" <<TICKETS_SECTION
## Tickets for CM

$(echo "$TICKETS" | sed 's/^/- /')

TICKETS_SECTION
fi

cat >> "$RELEASE_DIR/release-notes.md" <<SCANS
## Security Scan Summary (Local)

| Tool | Status |
|------|--------|
| npm audit | ${NPM_STATUS} |
| ESLint | ${ESLINT_STATUS} |
| Trivy | ${TRIVY_STATUS} |

> **Note**: These are local scan results. The trusted/official results
> come from the CodeBuild remote build (release-build.sh).
SCANS

print_ok "Release notes saved to: releases/${RELEASE_TAG}/release-notes.md"

# Save metadata for deploy / release-build to pick up
cat > "$RELEASE_DIR/.metadata" <<META
RELEASE_TAG=${RELEASE_TAG}
COMMIT_SHA=${CURRENT_SHA}
COMMIT_SHA_SHORT=${SHORT_SHA}
PREVIOUS_RELEASE=${LAST_TAG}
COMMIT_COUNT=${COMMIT_COUNT}
META

# ── Push to ECR ──────────────────────────────────────────────────────────────
print_header "Push to ECR"
echo ""
echo -n "  Push image to ECR now? (Y/n): "
read -r PUSH_CONFIRM
if [ "$PUSH_CONFIRM" != "n" ] && [ "$PUSH_CONFIRM" != "N" ]; then
    ensure_aws_auth

    ECR_URI="$(get_ecr_uri)"

    print_step "Logging into ECR..."
    aws ecr get-login-password --region "$AWS_REGION" | \
        docker login --username AWS --password-stdin \
        "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

    print_step "Tagging image for ECR..."
    docker tag "${APP_NAME}:${RELEASE_TAG}" "${ECR_URI}:${RELEASE_TAG}"
    docker tag "${APP_NAME}:${RELEASE_TAG}" "${ECR_URI}:${SHORT_SHA}"
    docker tag "${APP_NAME}:${RELEASE_TAG}" "${ECR_URI}:latest"

    print_step "Pushing to ECR..."
    docker push "${ECR_URI}:${RELEASE_TAG}"
    docker push "${ECR_URI}:${SHORT_SHA}"
    docker push "${ECR_URI}:latest"

    print_ok "Image pushed: ${ECR_URI}:${RELEASE_TAG}"
    ECR_PUSHED=true
else
    ECR_PUSHED=false
fi

# ── Summary ──────────────────────────────────────────────────────────────────
print_header "Release Preparation Summary"
echo ""
echo -e "  Release:    ${BOLD}${RELEASE_TAG}${NC}"
echo -e "  Commits:    ${COMMIT_COUNT}"
echo -e "  Commit SHA: ${SHORT_SHA}"
echo ""
echo -e "  Scans:"
echo -e "    npm audit: ${NPM_STATUS}"
echo -e "    ESLint:    ${ESLINT_STATUS}"
echo -e "    Trivy:     ${TRIVY_STATUS}"
echo ""
echo -e "  Artifacts:  releases/${RELEASE_TAG}/"
echo -e "    - ${BOLD}scan-report.html${NC}  (open in browser)"
echo -e "    - release-notes.md"
echo -e "    - commits.txt"
echo -e "    - audit-report.json"
echo -e "    - eslint-report.json"
echo -e "    - trivy-report.json"
echo ""

if [ "$SCAN_PASS" = false ]; then
    echo -e "  ${YELLOW}[WARN] Some scans have warnings. Review reports before proceeding.${NC}"
    echo ""
fi

if [ "$ECR_PUSHED" = true ]; then
    echo -e "  ${GREEN}Next step:${NC} Deploy to ECS:"
    echo -e "    ${BOLD}deploy.sh ${RELEASE_TAG}${NC}"
else
    echo -e "  ${GREEN}Next step:${NC} Push to ECR and deploy:"
    echo -e "    Push:   ${BOLD}release-build.sh${NC} (CodeBuild) or re-run this script"
    echo -e "    Deploy: ${BOLD}deploy.sh ${RELEASE_TAG}${NC}"
fi
echo ""
