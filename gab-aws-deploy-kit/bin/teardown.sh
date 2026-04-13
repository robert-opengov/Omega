#!/bin/bash
# Destroy all AWS resources for this application.
# Requires typing the full app name to confirm.

source "$(dirname "$0")/../lib/_common.sh"

ensure_aws_auth

print_header "TEARDOWN: ${APP_NAME}"
echo ""
echo -e "  ${RED}${BOLD}WARNING: This will delete ALL AWS resources for this application.${NC}"
echo ""
echo "  Resources to be deleted:"
echo "    - ECS Service & Cluster"
echo "    - ALB & Target Group"
echo "    - Security Groups"
echo "    - CodeBuild Project"
echo "    - ECR Repository (all images)"
echo "    - CloudWatch Log Group"
echo "    - IAM Roles"
echo "    - SSM Parameters"
if [ "${VPC_MODE:-shared}" = "dedicated" ]; then
    echo "    - Dedicated VPC & all networking"
fi
echo ""
echo -e "  ${YELLOW}S3 bucket will be preserved for audit history.${NC}"
echo ""
echo -e "  Type the full app name to confirm: ${BOLD}${APP_NAME}${NC}"
echo -n "  > "
read -r CONFIRMATION

if [ "$CONFIRMATION" != "$APP_NAME" ]; then
    print_error "Name does not match. Teardown cancelled."
    exit 1
fi

echo ""
echo -e "${RED}Proceeding with teardown...${NC}"
echo ""

# ── ECS Service ──────────────────────────────────────────────────────────────
print_step "Deleting ECS service..."
aws ecs update-service --cluster "$ECS_CLUSTER" --service "$ECS_SERVICE" --desired-count 0 > /dev/null 2>&1 || true
aws ecs delete-service --cluster "$ECS_CLUSTER" --service "$ECS_SERVICE" --force > /dev/null 2>&1 || true

print_step "Deleting ECS cluster..."
aws ecs delete-cluster --cluster "$ECS_CLUSTER" > /dev/null 2>&1 || true

# ── Auto-Scaling ─────────────────────────────────────────────────────────────
print_step "Removing auto-scaling..."
RESOURCE_ID="service/${ECS_CLUSTER}/${ECS_SERVICE}"
aws application-autoscaling deregister-scalable-target \
    --service-namespace ecs \
    --scalable-dimension "ecs:service:DesiredCount" \
    --resource-id "$RESOURCE_ID" > /dev/null 2>&1 || true

# ── ALB ──────────────────────────────────────────────────────────────────────
print_step "Deleting ALB and target group..."
ALB_ARN=$(aws elbv2 describe-load-balancers --names "$ALB_NAME" --query 'LoadBalancers[0].LoadBalancerArn' --output text 2>/dev/null || echo "")
if [ -n "$ALB_ARN" ] && [ "$ALB_ARN" != "None" ]; then
    LISTENERS=$(aws elbv2 describe-listeners --load-balancer-arn "$ALB_ARN" --query 'Listeners[].ListenerArn' --output text 2>/dev/null || echo "")
    for L in $LISTENERS; do
        aws elbv2 delete-listener --listener-arn "$L" > /dev/null 2>&1 || true
    done
    aws elbv2 delete-load-balancer --load-balancer-arn "$ALB_ARN" > /dev/null 2>&1 || true
fi

TG_ARN=$(aws elbv2 describe-target-groups --names "$TG_NAME" --query 'TargetGroups[0].TargetGroupArn' --output text 2>/dev/null || echo "")
if [ -n "$TG_ARN" ] && [ "$TG_ARN" != "None" ]; then
    aws elbv2 delete-target-group --target-group-arn "$TG_ARN" > /dev/null 2>&1 || true
fi

# ── Security Groups ──────────────────────────────────────────────────────────
print_step "Deleting security groups..."
for SG_NAME_DEL in "$ECS_SG_NAME" "$ALB_SG_NAME"; do
    SG_ID=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=${SG_NAME_DEL}" --query 'SecurityGroups[0].GroupId' --output text 2>/dev/null || echo "")
    if [ -n "$SG_ID" ] && [ "$SG_ID" != "None" ]; then
        aws ec2 delete-security-group --group-id "$SG_ID" > /dev/null 2>&1 || true
    fi
done

# ── Dedicated VPC Cleanup ────────────────────────────────────────────────────
if [ "${VPC_MODE:-shared}" = "dedicated" ]; then
    print_step "Cleaning up dedicated VPC..."
    VPC_TAG="${APP_NAME}-vpc"
    DEDICATED_VPC_ID=$(aws ec2 describe-vpcs \
        --filters "Name=tag:Name,Values=${VPC_TAG}" \
        --query 'Vpcs[0].VpcId' --output text 2>/dev/null || echo "None")

    if [ "$DEDICATED_VPC_ID" != "None" ] && [ -n "$DEDICATED_VPC_ID" ]; then
        # Delete NAT Gateways
        NAT_GWS=$(aws ec2 describe-nat-gateways \
            --filter "Name=vpc-id,Values=${DEDICATED_VPC_ID}" "Name=state,Values=available" \
            --query 'NatGateways[].NatGatewayId' --output text 2>/dev/null || echo "")
        for NGW in $NAT_GWS; do
            aws ec2 delete-nat-gateway --nat-gateway-id "$NGW" > /dev/null 2>&1 || true
        done
        # Wait for NAT deletion
        [ -n "$NAT_GWS" ] && sleep 30

        # Release EIPs
        EIPS=$(aws ec2 describe-addresses \
            --filters "Name=tag:App,Values=${APP_NAME}" \
            --query 'Addresses[].AllocationId' --output text 2>/dev/null || echo "")
        for EIP in $EIPS; do
            aws ec2 release-address --allocation-id "$EIP" > /dev/null 2>&1 || true
        done

        # Delete subnets
        SUBS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=${DEDICATED_VPC_ID}" \
            --query 'Subnets[].SubnetId' --output text 2>/dev/null || echo "")
        for SUB in $SUBS; do
            aws ec2 delete-subnet --subnet-id "$SUB" > /dev/null 2>&1 || true
        done

        # Delete route tables (non-main)
        RTS=$(aws ec2 describe-route-tables \
            --filters "Name=vpc-id,Values=${DEDICATED_VPC_ID}" \
            --query 'RouteTables[?Associations[0].Main!=`true`].RouteTableId' --output text 2>/dev/null || echo "")
        for RT in $RTS; do
            ASSOCS=$(aws ec2 describe-route-tables --route-table-ids "$RT" \
                --query 'RouteTables[0].Associations[].RouteTableAssociationId' --output text 2>/dev/null || echo "")
            for ASSOC in $ASSOCS; do
                aws ec2 disassociate-route-table --association-id "$ASSOC" > /dev/null 2>&1 || true
            done
            aws ec2 delete-route-table --route-table-id "$RT" > /dev/null 2>&1 || true
        done

        # Detach and delete IGW
        IGWS=$(aws ec2 describe-internet-gateways \
            --filters "Name=attachment.vpc-id,Values=${DEDICATED_VPC_ID}" \
            --query 'InternetGateways[].InternetGatewayId' --output text 2>/dev/null || echo "")
        for IGW in $IGWS; do
            aws ec2 detach-internet-gateway --internet-gateway-id "$IGW" --vpc-id "$DEDICATED_VPC_ID" > /dev/null 2>&1 || true
            aws ec2 delete-internet-gateway --internet-gateway-id "$IGW" > /dev/null 2>&1 || true
        done

        # Delete VPC
        aws ec2 delete-vpc --vpc-id "$DEDICATED_VPC_ID" > /dev/null 2>&1 || true
        print_ok "Dedicated VPC deleted: ${DEDICATED_VPC_ID}"
    fi
fi

# ── CodeBuild ────────────────────────────────────────────────────────────────
print_step "Deleting CodeBuild project..."
aws codebuild delete-project --name "$CODEBUILD_PROJECT" > /dev/null 2>&1 || true

# ── ECR ──────────────────────────────────────────────────────────────────────
print_step "Deleting ECR repository and all images..."
aws ecr delete-repository --repository-name "$ECR_REPO" --force > /dev/null 2>&1 || true

# ── CloudWatch ───────────────────────────────────────────────────────────────
print_step "Deleting CloudWatch log group..."
aws logs delete-log-group --log-group-name "$LOG_GROUP" > /dev/null 2>&1 || true

# ── IAM Roles ────────────────────────────────────────────────────────────────
print_step "Deleting IAM roles..."
for ROLE in "$IAM_CODEBUILD_ROLE" "$IAM_ECS_EXEC_ROLE" "$IAM_ECS_TASK_ROLE"; do
    POLICIES=$(aws iam list-attached-role-policies --role-name "$ROLE" --query 'AttachedPolicies[].PolicyArn' --output text 2>/dev/null || echo "")
    for P in $POLICIES; do
        aws iam detach-role-policy --role-name "$ROLE" --policy-arn "$P" > /dev/null 2>&1 || true
    done
    INLINE_POLICIES=$(aws iam list-role-policies --role-name "$ROLE" --query 'PolicyNames[]' --output text 2>/dev/null || echo "")
    for IP in $INLINE_POLICIES; do
        aws iam delete-role-policy --role-name "$ROLE" --policy-name "$IP" > /dev/null 2>&1 || true
    done
    aws iam delete-role --role-name "$ROLE" > /dev/null 2>&1 || true
done

# ── SSM Parameters ───────────────────────────────────────────────────────────
print_step "Deleting SSM parameters..."
PARAMS=$(aws ssm describe-parameters \
    --parameter-filters "Key=Name,Option=BeginsWith,Values=${SSM_PREFIX}/" \
    --query 'Parameters[].Name' \
    --output text 2>/dev/null || echo "")
for P in $PARAMS; do
    aws ssm delete-parameter --name "$P" > /dev/null 2>&1 || true
done

# ── Summary ──────────────────────────────────────────────────────────────────
print_header "Teardown Complete"
echo ""
echo -e "  ${GREEN}All resources deleted for ${APP_NAME}${NC}"
echo ""
echo -e "  ${DIM}S3 bucket preserved: ${S3_BUCKET}${NC}"
echo -e "  ${DIM}To delete the S3 bucket: aws s3 rb s3://${S3_BUCKET} --force${NC}"
echo ""
