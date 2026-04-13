#!/bin/bash
# Tail CloudWatch logs from ECS tasks.

source "$(dirname "$0")/../lib/_common.sh"

ensure_aws_auth

print_header "CloudWatch Logs: ${LOG_GROUP}"
echo -e "  ${DIM}Press Ctrl+C to stop${NC}"
echo ""

aws logs tail "$LOG_GROUP" \
    --follow \
    --since 5m \
    --format short
