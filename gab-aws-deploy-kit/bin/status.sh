#!/bin/bash
# Show ECS service health, running tasks, current release, and auto-scaling state.

source "$(dirname "$0")/../lib/_common.sh"

ensure_aws_auth

print_header "Service Status: ${APP_NAME}"

# ── ECS Service ──────────────────────────────────────────────────────────────
SERVICE_INFO=$(aws ecs describe-services \
    --cluster "$ECS_CLUSTER" \
    --services "$ECS_SERVICE" \
    --query 'services[0]' \
    --output json 2>/dev/null)

if [ -z "$SERVICE_INFO" ] || [ "$SERVICE_INFO" = "null" ]; then
    print_error "ECS service not found. Run setup.sh first."
    exit 1
fi

STATUS=$(echo "$SERVICE_INFO" | python3 -c "import sys, json; print(json.load(sys.stdin)['status'])")
DESIRED=$(echo "$SERVICE_INFO" | python3 -c "import sys, json; print(json.load(sys.stdin)['desiredCount'])")
RUNNING=$(echo "$SERVICE_INFO" | python3 -c "import sys, json; print(json.load(sys.stdin)['runningCount'])")
PENDING=$(echo "$SERVICE_INFO" | python3 -c "import sys, json; print(json.load(sys.stdin).get('pendingCount', 0))")

CURRENT_RELEASE=$(get_current_release)

echo ""
if [ "$STATUS" = "ACTIVE" ] && [ "$RUNNING" -gt 0 ]; then
    echo -e "  Status:  ${GREEN}${BOLD}RUNNING${NC}"
else
    echo -e "  Status:  ${YELLOW}${BOLD}${STATUS}${NC}"
fi
echo -e "  Release: ${BOLD}${CURRENT_RELEASE}${NC}"
echo -e "  Tasks:   ${RUNNING} running, ${PENDING} pending (desired: ${DESIRED})"

# ── ALB URL ──────────────────────────────────────────────────────────────────
ALB_DNS=$(aws elbv2 describe-load-balancers \
    --names "$ALB_NAME" \
    --query 'LoadBalancers[0].DNSName' \
    --output text 2>/dev/null || echo "unknown")
echo -e "  URL:     ${BOLD}http://${ALB_DNS}${NC}"

# ── Recent Deployments ───────────────────────────────────────────────────────
print_header "Recent Deployments"
echo "$SERVICE_INFO" | python3 -c "
import sys, json
svc = json.load(sys.stdin)
for dep in svc.get('deployments', [])[:3]:
    status = dep['status']
    desired = dep['desiredCount']
    running = dep['runningCount']
    created = str(dep['createdAt'])[:19]
    task_def = dep['taskDefinition'].split('/')[-1]
    print(f'  {status:<10} {task_def:<40} {running}/{desired} tasks  ({created})')
" 2>/dev/null

# ── Auto-Scaling ─────────────────────────────────────────────────────────────
print_header "Auto-Scaling"
RESOURCE_ID="service/${ECS_CLUSTER}/${ECS_SERVICE}"
SCALING=$(aws application-autoscaling describe-scalable-targets \
    --service-namespace ecs \
    --resource-ids "$RESOURCE_ID" \
    --query 'ScalableTargets[0]' \
    --output json 2>/dev/null)

if [ -n "$SCALING" ] && [ "$SCALING" != "null" ]; then
    MIN_CAP=$(echo "$SCALING" | python3 -c "import sys, json; print(json.load(sys.stdin)['MinCapacity'])")
    MAX_CAP=$(echo "$SCALING" | python3 -c "import sys, json; print(json.load(sys.stdin)['MaxCapacity'])")
    echo -e "  Range: ${MIN_CAP} - ${MAX_CAP} tasks"
    echo -e "  Current: ${RUNNING} tasks"
else
    echo "  Auto-scaling not configured"
fi

echo ""
