#!/bin/bash
# Run security scans locally (quick check, no release flow).

source "$(dirname "$0")/../lib/_common.sh"

require_cmd docker

cd "$APP_DIR"

PASS=true

print_header "Security Scan (Local)"

# ── npm audit ────────────────────────────────────────────────────────────────
print_step "Running npm audit..."
if npm audit --audit-level=high > /dev/null 2>&1; then
    print_ok "npm audit: PASS"
else
    print_warn "npm audit: HIGH/CRITICAL vulnerabilities found"
    npm audit --audit-level=high 2>&1 | tail -10
    PASS=false
fi

# ── ESLint ───────────────────────────────────────────────────────────────────
print_step "Running ESLint..."
if npx eslint . > /dev/null 2>&1; then
    print_ok "ESLint: PASS"
else
    print_warn "ESLint: issues found"
    npx eslint . 2>&1 | tail -10
fi

# ── Trivy ────────────────────────────────────────────────────────────────────
if command -v trivy &> /dev/null; then
    print_step "Building Docker image for scan..."
    docker build -t "${APP_NAME}:scan" . > /dev/null 2>&1

    print_step "Running Trivy scan..."
    if trivy image --severity CRITICAL,HIGH --exit-code 1 "${APP_NAME}:scan" > /dev/null 2>&1; then
        print_ok "Trivy: PASS"
    else
        print_warn "Trivy: CRITICAL/HIGH vulnerabilities found"
        trivy image --severity CRITICAL,HIGH "${APP_NAME}:scan" 2>&1 | tail -20
        PASS=false
    fi

    docker rmi "${APP_NAME}:scan" > /dev/null 2>&1 || true
else
    print_warn "Trivy not installed. Skipping container scan."
    echo -e "  ${DIM}Install: curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh${NC}"
fi

# ── Summary ──────────────────────────────────────────────────────────────────
print_header "Scan Summary"
if [ "$PASS" = true ]; then
    echo -e "  ${GREEN}${BOLD}All scans passed${NC}"
else
    echo -e "  ${YELLOW}${BOLD}Some scans have warnings -- review output above${NC}"
fi
echo ""
