#!/bin/bash
# Shared configuration loader, AWS SSO auth, and safety utilities.
# Source this file at the top of every script:
#   source "$(dirname "$0")/../lib/_common.sh"

set -euo pipefail

# ── Kit Directory Resolution ─────────────────────────────────────────────────
# All paths are relative to the kit root (aws-deploy-kit/)
LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KIT_DIR="$(cd "$LIB_DIR/.." && pwd)"

# ── Load Deploy Config ───────────────────────────────────────────────────────
DEPLOY_CONFIG="${DEPLOY_CONFIG:-$KIT_DIR/deploy-config}"

if [ ! -f "$DEPLOY_CONFIG" ]; then
    echo -e "\033[0;31m[ERROR] No deploy-config found at: ${DEPLOY_CONFIG}\033[0m"
    echo "  Copy the example and fill in your values:"
    echo "    cp deploy-config.example deploy-config"
    exit 1
fi

# shellcheck source=/dev/null
source "$DEPLOY_CONFIG"

# ── Validate Required Config ─────────────────────────────────────────────────
_require_var() {
    local VAR_NAME="$1"
    local DESCRIPTION="${2:-}"
    if [ -z "${!VAR_NAME:-}" ]; then
        echo -e "\033[0;31m[ERROR] Required config variable '${VAR_NAME}' is not set in deploy-config.\033[0m"
        [ -n "$DESCRIPTION" ] && echo "  $DESCRIPTION"
        exit 1
    fi
}

_require_var APP_NAME   "Unique name for AWS resources (e.g. my-cool-app)"
_require_var PROFILE    "AWS SSO profile name (e.g. gab-admin-dev)"
_require_var AWS_REGION "AWS region (e.g. us-east-2)"

# ── Defaults for optional config ─────────────────────────────────────────────
APP_DIR="${APP_DIR:-..}"
CONTAINER_PORT="${CONTAINER_PORT:-3000}"
VPC_MODE="${VPC_MODE:-shared}"
VPC_CIDR="${VPC_CIDR:-10.1.0.0/16}"
MIN_TASKS="${MIN_TASKS:-1}"
MAX_TASKS="${MAX_TASKS:-10}"
TASK_CPU="${TASK_CPU:-512}"
TASK_MEMORY="${TASK_MEMORY:-1024}"
SCALE_UP_CPU="${SCALE_UP_CPU:-70}"
SCALE_DOWN_CPU="${SCALE_DOWN_CPU:-30}"
DEPLOYMENT_MIN_PERCENT="${DEPLOYMENT_MIN_PERCENT:-100}"
DEPLOYMENT_MAX_PERCENT="${DEPLOYMENT_MAX_PERCENT:-200}"
HEALTH_CHECK_GRACE="${HEALTH_CHECK_GRACE:-60}"
HEALTH_CHECK_PATH="${HEALTH_CHECK_PATH:-/}"
TICKET_PATTERN="${TICKET_PATTERN:-[A-Z]+-[0-9]+}"

# ── Resolve APP_DIR (relative to kit dir, or absolute) ───────────────────────
if [[ "$APP_DIR" == /* ]]; then
    : # absolute path, use as-is
else
    APP_DIR="$(cd "$KIT_DIR" && cd "$APP_DIR" && pwd)"
fi

if [ ! -d "$APP_DIR" ]; then
    echo -e "\033[0;31m[ERROR] APP_DIR does not exist: ${APP_DIR}\033[0m"
    echo "  Set APP_DIR in deploy-config to the directory containing your Dockerfile."
    exit 1
fi

# ── Derived Paths ────────────────────────────────────────────────────────────
PROJECT_ROOT="$(cd "$APP_DIR" && git rev-parse --show-toplevel 2>/dev/null || pwd)"
RELEASES_DIR="$PROJECT_ROOT/releases"
DEPLOY_SECRETS_FILE="${KIT_DIR}/deploy-secrets"

# ── Derived AWS Resource Names (all prefixed for isolation) ──────────────────
ECR_REPO="${APP_NAME}"
S3_BUCKET="${APP_NAME}-releases"
ECS_CLUSTER="${APP_NAME}"
ECS_SERVICE="${APP_NAME}-svc"
ECS_TASK_DEF="${APP_NAME}"
ALB_NAME="${APP_NAME}"
TG_NAME="${APP_NAME:0:26}-tg"
ALB_SG_NAME="${APP_NAME}-alb-sg"
ECS_SG_NAME="${APP_NAME}-ecs-sg"
LOG_GROUP="/ecs/${APP_NAME}"
CODEBUILD_PROJECT="${APP_NAME}-build"
IAM_CODEBUILD_ROLE="${APP_NAME}-codebuild-role"
IAM_ECS_EXEC_ROLE="${APP_NAME}-ecs-exec-role"
IAM_ECS_TASK_ROLE="${APP_NAME}-ecs-task-role"
SSM_PREFIX="/${APP_NAME}"

# ── Colors ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

# ── AWS SSO Authentication ───────────────────────────────────────────────────
ensure_aws_auth() {
    echo -e "${DIM}-> Checking AWS SSO session...${NC}"
    if ! aws sts get-caller-identity --profile "$PROFILE" --region "$AWS_REGION" > /dev/null 2>&1; then
        echo -e "${YELLOW}[INFO] AWS SSO session expired. Logging in...${NC}"
        aws sso login --profile "$PROFILE"
    fi

    CREDS_JSON=$(aws configure export-credentials --profile "$PROFILE" --format process)
    export AWS_ACCESS_KEY_ID=$(echo "$CREDS_JSON" | python3 -c "import sys, json; print(json.load(sys.stdin)['AccessKeyId'])")
    export AWS_SECRET_ACCESS_KEY=$(echo "$CREDS_JSON" | python3 -c "import sys, json; print(json.load(sys.stdin)['SecretAccessKey'])")
    export AWS_SESSION_TOKEN=$(echo "$CREDS_JSON" | python3 -c "import sys, json; print(json.load(sys.stdin)['SessionToken'])")
    export AWS_DEFAULT_REGION="$AWS_REGION"

    local ACCOUNT_ID
    ACCOUNT_ID=$(aws sts get-caller-identity --query 'Account' --output text 2>/dev/null)
    local CALLER
    CALLER=$(aws sts get-caller-identity --query 'Arn' --output text 2>/dev/null)

    echo -e "${GREEN}[OK] AWS authenticated${NC}"
    echo -e "  Account: ${BOLD}${ACCOUNT_ID}${NC}"
    echo -e "  Identity: ${DIM}${CALLER}${NC}"
    echo -e "  Region:  ${BOLD}${AWS_REGION}${NC}"
    echo ""

    export AWS_ACCOUNT_ID="$ACCOUNT_ID"
}

# ── Safety: Confirm Before Destructive Actions ───────────────────────────────
confirm_action() {
    local ACTION_DESC="$1"
    local RESOURCE="${2:-$APP_NAME}"

    echo ""
    echo -e "${YELLOW}╔══════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║  CONFIRM ACTION                                  ║${NC}"
    echo -e "${YELLOW}╚══════════════════════════════════════════════════╝${NC}"
    echo -e "  Action:   ${BOLD}${ACTION_DESC}${NC}"
    echo -e "  Resource: ${BOLD}${RESOURCE}${NC}"
    echo -e "  Account:  ${BOLD}${AWS_ACCOUNT_ID:-unknown}${NC}"
    echo -e "  Region:   ${BOLD}${AWS_REGION}${NC}"
    echo ""
    echo -n -e "  Proceed? (y/N): "
    read -r CONFIRM
    if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
        echo -e "${RED}Cancelled.${NC}"
        exit 0
    fi
    echo ""
}

# ── Safety: Verify Resource Prefix ───────────────────────────────────────────
check_prefix() {
    local RESOURCE_NAME="$1"
    if [[ "$RESOURCE_NAME" != *"$APP_NAME"* ]]; then
        echo -e "${RED}[ERROR] Resource '${RESOURCE_NAME}' does not match app prefix '${APP_NAME}'.${NC}"
        echo "  Refusing to operate on resources outside this project."
        exit 1
    fi
}

# ── Get Current Deployed Release Tag ─────────────────────────────────────────
get_current_release() {
    aws ecr list-tags-for-resource \
        --resource-arn "arn:aws:ecr:${AWS_REGION}:${AWS_ACCOUNT_ID}:repository/${ECR_REPO}" \
        --query "tags[?Key=='CURRENT_RELEASE'].Value" \
        --output text 2>/dev/null || echo "none"
}

# ── Get Last Release Tag from Git ────────────────────────────────────────────
get_last_release_tag() {
    git -C "$PROJECT_ROOT" tag -l 'release-*' --sort=-version:refname | head -1
}

# ── Get ECR Image URI ────────────────────────────────────────────────────────
get_ecr_uri() {
    echo "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}"
}

# ── Print Helpers ────────────────────────────────────────────────────────────
print_header() {
    local TITLE="$1"
    echo ""
    echo -e "${CYAN}---[ ${TITLE} ]$(printf '%*s' $((50 - ${#TITLE})) '' | tr ' ' '-')${NC}"
}

print_step() {
    echo -e "  ${GREEN}->$NC $1"
}

print_warn() {
    echo -e "  ${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "  ${RED}[ERROR]${NC} $1"
}

print_ok() {
    echo -e "  ${GREEN}[OK]${NC} $1"
}

# ── Require Command ──────────────────────────────────────────────────────────
require_cmd() {
    if ! command -v "$1" &> /dev/null; then
        print_error "$1 is required but not installed."
        exit 1
    fi
}
