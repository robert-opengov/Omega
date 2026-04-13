#!/bin/bash
# Shared ECS task definition and deployment functions.
# Sourced by _common.sh -- do not run directly.

# ── Discover SSM Secrets ─────────────────────────────────────────────────────
# Returns a JSON array of SSM parameter names under the app prefix.
discover_ssm_secrets() {
    aws ssm describe-parameters \
        --parameter-filters "Key=Name,Option=BeginsWith,Values=${SSM_PREFIX}/" \
        --query 'Parameters[].Name' \
        --output json 2>/dev/null || echo "[]"
}

# ── Update Task Definition ───────────────────────────────────────────────────
# Registers a new task definition with the given image tag and all SSM secrets.
# Usage: NEW_ARN=$(update_task_definition "release-1.0.0")
update_task_definition() {
    local IMAGE_TAG="$1"
    local ECR_URI
    ECR_URI="$(get_ecr_uri)"

    print_step "Discovering SSM secrets..." >&2
    local SSM_SECRETS
    SSM_SECRETS=$(discover_ssm_secrets)

    local SSM_COUNT
    SSM_COUNT=$(echo "$SSM_SECRETS" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))")
    print_ok "Found ${SSM_COUNT} SSM parameters to inject" >&2

    print_step "Updating task definition..." >&2
    local CURRENT_TASK_DEF
    CURRENT_TASK_DEF=$(aws ecs describe-services \
        --cluster "$ECS_CLUSTER" \
        --services "$ECS_SERVICE" \
        --query 'services[0].taskDefinition' \
        --output text)

    local TASK_DEF_JSON
    TASK_DEF_JSON=$(aws ecs describe-task-definition \
        --task-definition "$CURRENT_TASK_DEF" \
        --query 'taskDefinition')

    local NEW_TASK_DEF
    NEW_TASK_DEF=$(echo "$TASK_DEF_JSON" | python3 -c "
import sys, json
td = json.load(sys.stdin)
td['containerDefinitions'][0]['image'] = '${ECR_URI}:${IMAGE_TAG}'
ssm_names = json.loads('''${SSM_SECRETS}''')
td['containerDefinitions'][0]['secrets'] = [
    {'name': p.split('/')[-1], 'valueFrom': p} for p in ssm_names
]
keep = ['family','containerDefinitions','taskRoleArn','executionRoleArn',
        'networkMode','volumes','placementConstraints','requiresCompatibilities',
        'cpu','memory','runtimePlatform']
print(json.dumps({k:v for k,v in td.items() if k in keep and v}))
")

    local NEW_TASK_DEF_ARN
    NEW_TASK_DEF_ARN=$(aws ecs register-task-definition \
        --cli-input-json "$NEW_TASK_DEF" \
        --query 'taskDefinition.taskDefinitionArn' \
        --output text)

    print_ok "New task definition: ${NEW_TASK_DEF_ARN}" >&2
    echo "$NEW_TASK_DEF_ARN"
}

# ── Deploy Task ──────────────────────────────────────────────────────────────
# Updates the ECS service with the given task definition ARN and waits for stability.
# Usage: deploy_task "$NEW_TASK_DEF_ARN"
deploy_task() {
    local TASK_DEF_ARN="$1"
    local WAIT="${2:-true}"

    print_step "Updating ECS service..."
    aws ecs update-service \
        --cluster "$ECS_CLUSTER" \
        --service "$ECS_SERVICE" \
        --task-definition "$TASK_DEF_ARN" \
        --force-new-deployment \
        --query 'service.serviceName' \
        --output text > /dev/null

    print_ok "ECS service update triggered"

    if [ "$WAIT" = "true" ]; then
        print_step "Waiting for deployment to stabilize..."
        echo -e "  ${DIM}(this may take 2-5 minutes)${NC}"

        if aws ecs wait services-stable \
            --cluster "$ECS_CLUSTER" \
            --services "$ECS_SERVICE" 2>/dev/null; then
            print_ok "Deployment stable!"
        else
            print_warn "Deployment may still be in progress. Check with: status.sh"
        fi
    fi
}

# ── Tag Current Release in ECR ───────────────────────────────────────────────
tag_current_release() {
    local RELEASE_TAG="$1"

    print_step "Updating CURRENT_RELEASE tag..."
    local MANIFEST
    MANIFEST=$(aws ecr batch-get-image \
        --repository-name "$ECR_REPO" \
        --image-ids "imageTag=${RELEASE_TAG}" \
        --query 'images[0].imageManifest' \
        --output text 2>/dev/null)

    if [ -n "$MANIFEST" ]; then
        aws ecr put-image \
            --repository-name "$ECR_REPO" \
            --image-tag "CURRENT_RELEASE" \
            --image-manifest "$MANIFEST" > /dev/null 2>&1 || true
    fi
}

# ── Log Deploy/Rollback Event to S3 ─────────────────────────────────────────
log_deploy_event() {
    local EVENT_TYPE="$1"
    local RELEASE_TAG="$2"
    local PREVIOUS_RELEASE="$3"
    local TASK_DEF_ARN="${4:-}"

    local DEPLOYER
    DEPLOYER=$(aws sts get-caller-identity --query 'Arn' --output text 2>/dev/null || echo "unknown")
    local TIMESTAMP
    TIMESTAMP=$(date -u +%Y%m%dT%H%M%SZ)
    local ECR_URI
    ECR_URI="$(get_ecr_uri)"

    local EVENT_JSON
    EVENT_JSON=$(cat <<EVENTEOF
{
  "event": "${EVENT_TYPE}",
  "release_tag": "${RELEASE_TAG}",
  "previous_release": "${PREVIOUS_RELEASE}",
  "deployed_by": "${DEPLOYER}",
  "deployed_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "task_definition": "${TASK_DEF_ARN}",
  "image": "${ECR_URI}:${RELEASE_TAG}"
}
EVENTEOF
)

    echo "$EVENT_JSON" | aws s3 cp - \
        "s3://${S3_BUCKET}/deploy-log/${EVENT_TYPE}-${TIMESTAMP}.json" \
        --quiet 2>/dev/null || true
}
