#!/bin/bash
# One-time AWS infrastructure setup. Idempotent -- safe to re-run.
# Creates: ECR, S3, CloudWatch, VPC, SGs, ALB, IAM, ECS, auto-scaling, CodeBuild, SSM

source "$(dirname "$0")/../lib/_common.sh"
source "$LIB_DIR/_vpc.sh"
source "$LIB_DIR/_task-def.sh"

require_cmd aws
require_cmd docker

ensure_aws_auth

print_header "AWS Infrastructure Setup for ${APP_NAME}"
echo -e "  Account: ${BOLD}${AWS_ACCOUNT_ID}${NC}"
echo -e "  Region:  ${BOLD}${AWS_REGION}${NC}"
echo -e "  VPC:     ${BOLD}${VPC_MODE}${NC}"
echo ""
echo "  This will create all AWS resources needed to run the application."
echo "  Each step checks if the resource already exists and skips if so."
echo ""
echo -n "  Continue? (y/N): "
read -r CONFIRM
if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "Cancelled."
    exit 0
fi

# ══════════════════════════════════════════════════════════════════════════════
# 1. ECR Repository
# ══════════════════════════════════════════════════════════════════════════════
print_header "1. ECR Repository"
if aws ecr describe-repositories --repository-names "$ECR_REPO" > /dev/null 2>&1; then
    print_ok "ECR repository already exists: ${ECR_REPO}"
else
    print_step "Creating ECR repository: ${ECR_REPO}"
    aws ecr create-repository \
        --repository-name "$ECR_REPO" \
        --image-scanning-configuration scanOnPush=true \
        --encryption-configuration encryptionType=AES256 \
        --query 'repository.repositoryUri' \
        --output text
    print_ok "ECR repository created"
fi

print_step "Setting lifecycle policy (keep last 15 images)..."
aws ecr put-lifecycle-policy \
    --repository-name "$ECR_REPO" \
    --lifecycle-policy-text '{
        "rules": [{
            "rulePriority": 1,
            "description": "Keep last 15 images",
            "selection": {
                "tagStatus": "any",
                "countType": "imageCountMoreThan",
                "countNumber": 15
            },
            "action": { "type": "expire" }
        }]
    }' > /dev/null 2>&1
print_ok "Lifecycle policy set"

# ══════════════════════════════════════════════════════════════════════════════
# 2. S3 Bucket
# ══════════════════════════════════════════════════════════════════════════════
print_header "2. S3 Bucket"
if aws s3api head-bucket --bucket "$S3_BUCKET" > /dev/null 2>&1; then
    print_ok "S3 bucket already exists: ${S3_BUCKET}"
else
    print_step "Creating S3 bucket: ${S3_BUCKET}"
    aws s3api create-bucket \
        --bucket "$S3_BUCKET" \
        --region "$AWS_REGION" \
        --create-bucket-configuration LocationConstraint="$AWS_REGION" > /dev/null
    aws s3api put-bucket-versioning \
        --bucket "$S3_BUCKET" \
        --versioning-configuration Status=Enabled
    aws s3api put-bucket-encryption \
        --bucket "$S3_BUCKET" \
        --server-side-encryption-configuration '{
            "Rules": [{"ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}}]
        }'
    print_ok "S3 bucket created with versioning and encryption"
fi

# ══════════════════════════════════════════════════════════════════════════════
# 3. CloudWatch Log Group
# ══════════════════════════════════════════════════════════════════════════════
print_header "3. CloudWatch Log Group"
if aws logs describe-log-groups --log-group-name-prefix "$LOG_GROUP" --query "logGroups[?logGroupName=='${LOG_GROUP}']" --output text | grep -q .; then
    print_ok "Log group already exists: ${LOG_GROUP}"
else
    print_step "Creating log group: ${LOG_GROUP}"
    aws logs create-log-group --log-group-name "$LOG_GROUP"
    aws logs put-retention-policy --log-group-name "$LOG_GROUP" --retention-in-days 30
    print_ok "Log group created with 30-day retention"
fi

# ══════════════════════════════════════════════════════════════════════════════
# 4. VPC & Networking (uses _vpc.sh)
# ══════════════════════════════════════════════════════════════════════════════
resolve_vpc

# ══════════════════════════════════════════════════════════════════════════════
# 5. Security Groups
# ══════════════════════════════════════════════════════════════════════════════
print_header "5. Security Groups"

ALB_SG_ID=$(aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=${ALB_SG_NAME}" "Name=vpc-id,Values=${VPC_ID}" \
    --query 'SecurityGroups[0].GroupId' \
    --output text 2>/dev/null)

if [ "$ALB_SG_ID" = "None" ] || [ -z "$ALB_SG_ID" ]; then
    print_step "Creating ALB security group: ${ALB_SG_NAME}"
    ALB_SG_ID=$(aws ec2 create-security-group \
        --group-name "$ALB_SG_NAME" \
        --description "ALB for ${APP_NAME}" \
        --vpc-id "$VPC_ID" \
        --query 'GroupId' \
        --output text)
    aws ec2 authorize-security-group-ingress --group-id "$ALB_SG_ID" \
        --protocol tcp --port 80 --cidr 0.0.0.0/0 > /dev/null
    aws ec2 authorize-security-group-ingress --group-id "$ALB_SG_ID" \
        --protocol tcp --port 443 --cidr 0.0.0.0/0 > /dev/null
    print_ok "ALB SG created: ${ALB_SG_ID}"
else
    print_ok "ALB SG already exists: ${ALB_SG_ID}"
fi

ECS_SG_ID=$(aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=${ECS_SG_NAME}" "Name=vpc-id,Values=${VPC_ID}" \
    --query 'SecurityGroups[0].GroupId' \
    --output text 2>/dev/null)

if [ "$ECS_SG_ID" = "None" ] || [ -z "$ECS_SG_ID" ]; then
    print_step "Creating ECS security group: ${ECS_SG_NAME}"
    ECS_SG_ID=$(aws ec2 create-security-group \
        --group-name "$ECS_SG_NAME" \
        --description "ECS tasks for ${APP_NAME}" \
        --vpc-id "$VPC_ID" \
        --query 'GroupId' \
        --output text)
    aws ec2 authorize-security-group-ingress --group-id "$ECS_SG_ID" \
        --protocol tcp --port "$CONTAINER_PORT" --source-group "$ALB_SG_ID" > /dev/null
    print_ok "ECS SG created: ${ECS_SG_ID} (accepts traffic from ALB only)"
else
    print_ok "ECS SG already exists: ${ECS_SG_ID}"
fi

# ══════════════════════════════════════════════════════════════════════════════
# 6. ALB & Target Group
# ══════════════════════════════════════════════════════════════════════════════
print_header "6. Application Load Balancer"

ALB_ARN=$(aws elbv2 describe-load-balancers \
    --names "$ALB_NAME" \
    --query 'LoadBalancers[0].LoadBalancerArn' \
    --output text 2>/dev/null || echo "")

if [ -z "$ALB_ARN" ] || [ "$ALB_ARN" = "None" ]; then
    print_step "Creating ALB: ${ALB_NAME}"
    ALB_ARN=$(aws elbv2 create-load-balancer \
        --name "$ALB_NAME" \
        --subnets $(echo "$PUBLIC_SUBNET_IDS" | tr ',' ' ') \
        --security-groups "$ALB_SG_ID" \
        --scheme internet-facing \
        --type application \
        --query 'LoadBalancers[0].LoadBalancerArn' \
        --output text)
    print_ok "ALB created"
else
    print_ok "ALB already exists"
fi

ALB_DNS=$(aws elbv2 describe-load-balancers \
    --load-balancer-arns "$ALB_ARN" \
    --query 'LoadBalancers[0].DNSName' \
    --output text)
print_ok "ALB URL: http://${ALB_DNS}"

TG_ARN=$(aws elbv2 describe-target-groups \
    --names "$TG_NAME" \
    --query 'TargetGroups[0].TargetGroupArn' \
    --output text 2>/dev/null || echo "")

if [ -z "$TG_ARN" ] || [ "$TG_ARN" = "None" ]; then
    print_step "Creating target group: ${TG_NAME}"
    TG_ARN=$(aws elbv2 create-target-group \
        --name "$TG_NAME" \
        --protocol HTTP \
        --port "$CONTAINER_PORT" \
        --vpc-id "$VPC_ID" \
        --target-type ip \
        --health-check-path "$HEALTH_CHECK_PATH" \
        --health-check-interval-seconds 30 \
        --health-check-timeout-seconds 5 \
        --healthy-threshold-count 2 \
        --unhealthy-threshold-count 3 \
        --query 'TargetGroups[0].TargetGroupArn' \
        --output text)
    print_ok "Target group created"
else
    print_ok "Target group already exists"
fi

LISTENER_ARN=$(aws elbv2 describe-listeners \
    --load-balancer-arn "$ALB_ARN" \
    --query 'Listeners[0].ListenerArn' \
    --output text 2>/dev/null || echo "")

if [ -z "$LISTENER_ARN" ] || [ "$LISTENER_ARN" = "None" ]; then
    print_step "Creating HTTP listener..."
    aws elbv2 create-listener \
        --load-balancer-arn "$ALB_ARN" \
        --protocol HTTP \
        --port 80 \
        --default-actions "Type=forward,TargetGroupArn=${TG_ARN}" > /dev/null
    print_ok "HTTP listener created (port 80)"
else
    print_ok "Listener already exists"
fi

# ══════════════════════════════════════════════════════════════════════════════
# 7. IAM Roles
# ══════════════════════════════════════════════════════════════════════════════
print_header "7. IAM Roles"

create_role_if_missing() {
    local ROLE_NAME="$1"
    local TRUST_POLICY="$2"
    local POLICY_ARNS="$3"

    if aws iam get-role --role-name "$ROLE_NAME" > /dev/null 2>&1; then
        print_ok "IAM role already exists: ${ROLE_NAME}"
        return
    fi

    print_step "Creating IAM role: ${ROLE_NAME}"
    aws iam create-role \
        --role-name "$ROLE_NAME" \
        --assume-role-policy-document "$TRUST_POLICY" > /dev/null

    IFS=',' read -ra ARNS <<< "$POLICY_ARNS"
    for ARN in "${ARNS[@]}"; do
        aws iam attach-role-policy --role-name "$ROLE_NAME" --policy-arn "$ARN"
    done
    print_ok "IAM role created: ${ROLE_NAME}"
}

ECS_TRUST='{
    "Version": "2012-10-17",
    "Statement": [{
        "Effect": "Allow",
        "Principal": {"Service": "ecs-tasks.amazonaws.com"},
        "Action": "sts:AssumeRole"
    }]
}'

CODEBUILD_TRUST='{
    "Version": "2012-10-17",
    "Statement": [{
        "Effect": "Allow",
        "Principal": {"Service": "codebuild.amazonaws.com"},
        "Action": "sts:AssumeRole"
    }]
}'

create_role_if_missing "$IAM_ECS_EXEC_ROLE" "$ECS_TRUST" \
    "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"

create_role_if_missing "$IAM_ECS_TASK_ROLE" "$ECS_TRUST" \
    "arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess"

CODEBUILD_INLINE_POLICY=""
CODEBUILD_POLICY_NAME="${APP_NAME}-codebuild-policy"
if ! aws iam get-policy --policy-arn "arn:aws:iam::${AWS_ACCOUNT_ID}:policy/${CODEBUILD_POLICY_NAME}" > /dev/null 2>&1; then
    CODEBUILD_INLINE_POLICY=$(cat <<CBPOLICY
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ecr:GetAuthorizationToken",
                "ecr:BatchCheckLayerAvailability",
                "ecr:GetDownloadUrlForLayer",
                "ecr:BatchGetImage",
                "ecr:PutImage",
                "ecr:InitiateLayerUpload",
                "ecr:UploadLayerPart",
                "ecr:CompleteLayerUpload"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:GetBucketLocation"
            ],
            "Resource": [
                "arn:aws:s3:::${S3_BUCKET}",
                "arn:aws:s3:::${S3_BUCKET}/*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            "Resource": "*"
        }
    ]
}
CBPOLICY
)
fi

create_role_if_missing "$IAM_CODEBUILD_ROLE" "$CODEBUILD_TRUST" \
    "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser"

if [ -n "${CODEBUILD_INLINE_POLICY:-}" ]; then
    aws iam put-role-policy \
        --role-name "$IAM_CODEBUILD_ROLE" \
        --policy-name "${APP_NAME}-codebuild-inline" \
        --policy-document "$CODEBUILD_INLINE_POLICY" 2>/dev/null || true
fi

SSM_POLICY=$(cat <<SSMPOLICY
{
    "Version": "2012-10-17",
    "Statement": [{
        "Effect": "Allow",
        "Action": [
            "ssm:GetParameters",
            "ssm:GetParameter"
        ],
        "Resource": "arn:aws:ssm:${AWS_REGION}:${AWS_ACCOUNT_ID}:parameter${SSM_PREFIX}/*"
    }]
}
SSMPOLICY
)
aws iam put-role-policy \
    --role-name "$IAM_ECS_EXEC_ROLE" \
    --policy-name "${APP_NAME}-ssm-read" \
    --policy-document "$SSM_POLICY" 2>/dev/null || true

# ══════════════════════════════════════════════════════════════════════════════
# 8. ECS Cluster, Task Definition & Service
# ══════════════════════════════════════════════════════════════════════════════
print_header "8. ECS Cluster & Service"

if aws ecs describe-clusters --clusters "$ECS_CLUSTER" --query "clusters[?status=='ACTIVE']" --output text | grep -q .; then
    print_ok "ECS cluster already exists: ${ECS_CLUSTER}"
else
    print_step "Creating ECS cluster: ${ECS_CLUSTER}"
    aws ecs create-cluster --cluster-name "$ECS_CLUSTER" > /dev/null
    print_ok "ECS cluster created"
fi

ECR_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}"

TASK_DEF_JSON=$(cat <<TASKDEF
{
    "family": "${ECS_TASK_DEF}",
    "networkMode": "awsvpc",
    "requiresCompatibilities": ["FARGATE"],
    "cpu": "${TASK_CPU}",
    "memory": "${TASK_MEMORY}",
    "executionRoleArn": "arn:aws:iam::${AWS_ACCOUNT_ID}:role/${IAM_ECS_EXEC_ROLE}",
    "taskRoleArn": "arn:aws:iam::${AWS_ACCOUNT_ID}:role/${IAM_ECS_TASK_ROLE}",
    "containerDefinitions": [{
        "name": "${APP_NAME}",
        "image": "${ECR_URI}:latest",
        "portMappings": [{
            "containerPort": ${CONTAINER_PORT},
            "protocol": "tcp"
        }],
        "essential": true,
        "logConfiguration": {
            "logDriver": "awslogs",
            "options": {
                "awslogs-group": "${LOG_GROUP}",
                "awslogs-region": "${AWS_REGION}",
                "awslogs-stream-prefix": "ecs"
            }
        },
        "environment": [
            {"name": "NODE_ENV", "value": "production"},
            {"name": "PORT", "value": "${CONTAINER_PORT}"},
            {"name": "HOSTNAME", "value": "0.0.0.0"}
        ],
        "secrets": []
    }]
}
TASKDEF
)

print_step "Registering task definition: ${ECS_TASK_DEF}"
aws ecs register-task-definition --cli-input-json "$TASK_DEF_JSON" > /dev/null
print_ok "Task definition registered"

# Pick first two subnets for the ECS service (private for dedicated, public for shared)
FIRST_SUBNET=$(echo "$PRIVATE_SUBNET_IDS" | cut -d',' -f1)
SECOND_SUBNET=$(echo "$PRIVATE_SUBNET_IDS" | cut -d',' -f2)

SERVICE_EXISTS=$(aws ecs describe-services \
    --cluster "$ECS_CLUSTER" \
    --services "$ECS_SERVICE" \
    --query "services[?status=='ACTIVE'].serviceName" \
    --output text 2>/dev/null || echo "")

if [ -n "$SERVICE_EXISTS" ]; then
    print_ok "ECS service already exists: ${ECS_SERVICE}"
else
    print_step "Creating ECS service: ${ECS_SERVICE}"
    aws ecs create-service \
        --cluster "$ECS_CLUSTER" \
        --service-name "$ECS_SERVICE" \
        --task-definition "$ECS_TASK_DEF" \
        --desired-count "$MIN_TASKS" \
        --launch-type FARGATE \
        --deployment-configuration "minimumHealthyPercent=${DEPLOYMENT_MIN_PERCENT},maximumPercent=${DEPLOYMENT_MAX_PERCENT},deploymentCircuitBreaker={enable=true,rollback=true}" \
        --health-check-grace-period-seconds "$HEALTH_CHECK_GRACE" \
        --network-configuration "awsvpcConfiguration={subnets=[${FIRST_SUBNET},${SECOND_SUBNET}],securityGroups=[${ECS_SG_ID}],assignPublicIp=${ASSIGN_PUBLIC_IP}}" \
        --load-balancers "targetGroupArn=${TG_ARN},containerName=${APP_NAME},containerPort=${CONTAINER_PORT}" > /dev/null
    print_ok "ECS service created with circuit breaker rollback"
fi

# ══════════════════════════════════════════════════════════════════════════════
# 9. Auto Scaling
# ══════════════════════════════════════════════════════════════════════════════
print_header "9. Auto Scaling"

RESOURCE_ID="service/${ECS_CLUSTER}/${ECS_SERVICE}"

print_step "Registering scalable target (min: ${MIN_TASKS}, max: ${MAX_TASKS})..."
aws application-autoscaling register-scalable-target \
    --service-namespace ecs \
    --scalable-dimension "ecs:service:DesiredCount" \
    --resource-id "$RESOURCE_ID" \
    --min-capacity "$MIN_TASKS" \
    --max-capacity "$MAX_TASKS" 2>/dev/null || true

print_step "Setting CPU target tracking policy..."
aws application-autoscaling put-scaling-policy \
    --service-namespace ecs \
    --scalable-dimension "ecs:service:DesiredCount" \
    --resource-id "$RESOURCE_ID" \
    --policy-name "${APP_NAME}-cpu-scaling" \
    --policy-type TargetTrackingScaling \
    --target-tracking-scaling-policy-configuration "{
        \"TargetValue\": ${SCALE_UP_CPU},
        \"PredefinedMetricSpecification\": {
            \"PredefinedMetricType\": \"ECSServiceAverageCPUUtilization\"
        },
        \"ScaleInCooldown\": 300,
        \"ScaleOutCooldown\": 60
    }" > /dev/null 2>&1 || true
print_ok "Auto-scaling configured"

# ══════════════════════════════════════════════════════════════════════════════
# 10. CodeBuild Project
# ══════════════════════════════════════════════════════════════════════════════
print_header "10. CodeBuild Project"

GITHUB_REPO="${GITHUB_REPO:-}"
if [ -z "$GITHUB_REPO" ]; then
    print_warn "GITHUB_REPO not set in deploy-config. Skipping CodeBuild."
    echo "  Using local CLI workflow (release-prepare.sh -> deploy.sh)."
    echo "  Set GITHUB_REPO in deploy-config and re-run setup.sh to enable CodeBuild later."
else
    CB_COUNT=$(aws codebuild batch-get-projects --names "$CODEBUILD_PROJECT" --query 'length(projects)' --output text 2>/dev/null || echo "0")
    if [ "$CB_COUNT" -gt 0 ] 2>/dev/null; then
        print_ok "CodeBuild project already exists: ${CODEBUILD_PROJECT}"
    else
        CODESTAR_ARN="${CODESTAR_ARN:-}"

        if [ -z "$CODESTAR_ARN" ]; then
            echo ""
            echo "  CodeBuild needs a GitHub connection to pull your code."
            echo "  If you don't have a CodeStar connection yet, create one at:"
            echo "  https://console.aws.amazon.com/codesuite/settings/connections"
            echo ""
            echo -n "  Enter CodeStar connection ARN (or 'skip' to set up later): "
            read -r CODESTAR_ARN
        fi

        if [ "$CODESTAR_ARN" = "skip" ]; then
            print_warn "CodeBuild setup skipped. Run this script again to complete."
        else
            print_step "Registering GitHub connection as source credential..."
            aws codebuild import-source-credentials \
                --server-type GITHUB \
                --auth-type CODECONNECTIONS \
                --token "$CODESTAR_ARN" > /dev/null 2>&1 || true

            BUILDSPEC_PATH="gab-aws-deploy-kit/buildspec.yml"

            print_step "Creating CodeBuild project: ${CODEBUILD_PROJECT}"
            aws codebuild create-project \
                --name "$CODEBUILD_PROJECT" \
                --source "{
                    \"type\": \"GITHUB\",
                    \"location\": \"https://github.com/${GITHUB_REPO}.git\",
                    \"buildspec\": \"${BUILDSPEC_PATH}\"
                }" \
                --artifacts '{"type": "NO_ARTIFACTS"}' \
                --environment "{
                    \"type\": \"LINUX_CONTAINER\",
                    \"image\": \"aws/codebuild/amazonlinux2-x86_64-standard:5.0\",
                    \"computeType\": \"BUILD_GENERAL1_SMALL\",
                    \"privilegedMode\": true,
                    \"environmentVariables\": [
                        {\"name\": \"AWS_DEFAULT_REGION\", \"value\": \"${AWS_REGION}\"},
                        {\"name\": \"AWS_ACCOUNT_ID\", \"value\": \"${AWS_ACCOUNT_ID}\"},
                        {\"name\": \"APP_NAME\", \"value\": \"${APP_NAME}\"},
                        {\"name\": \"APP_DIR\", \"value\": \".\"}
                    ]
                }" \
                --service-role "arn:aws:iam::${AWS_ACCOUNT_ID}:role/${IAM_CODEBUILD_ROLE}" \
                --logs-config "{
                    \"cloudWatchLogs\": {
                        \"status\": \"ENABLED\",
                        \"groupName\": \"${LOG_GROUP}\",
                        \"streamName\": \"codebuild\"
                    }
                }" > /dev/null
            print_ok "CodeBuild project created"
        fi
    fi
fi

# ══════════════════════════════════════════════════════════════════════════════
# 11. SSM Parameters (Secrets) -- reads from deploy-secrets schema
# ══════════════════════════════════════════════════════════════════════════════
print_header "11. SSM Parameters (Secrets)"

SECRETS_VALUES_FILE="${KIT_DIR}/deploy-secrets.values"

if [ -f "$SECRETS_VALUES_FILE" ]; then
    print_step "Found deploy-secrets.values -- auto-importing..."
    bash "${KIT_DIR}/bin/secrets.sh" import "$SECRETS_VALUES_FILE"
elif [ -f "$DEPLOY_SECRETS_FILE" ]; then
    echo "  Reading secret schema from: deploy-secrets"
    echo "  Press Enter to skip any parameter (can be set later with: secrets.sh)"
    echo ""

    while IFS= read -r line <&3; do
        [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue

        PARAM_NAME=$(echo "$line" | cut -d'=' -f1 | tr -d '[:space:]')
        [ -z "$PARAM_NAME" ] && continue

        FULL_NAME="${SSM_PREFIX}/${PARAM_NAME}"
        if aws ssm get-parameter --name "$FULL_NAME" > /dev/null 2>&1; then
            print_ok "${PARAM_NAME} already set"
        else
            echo -n "  Enter value for ${PARAM_NAME} (Enter to skip): "
            read -rs PARAM_VALUE < /dev/tty
            echo ""
            if [ -n "$PARAM_VALUE" ]; then
                PARAM_TYPE="SecureString"
                if [[ "$PARAM_NAME" == NEXT_PUBLIC_* ]]; then
                    PARAM_TYPE="String"
                fi
                aws ssm put-parameter \
                    --name "$FULL_NAME" \
                    --value "$PARAM_VALUE" \
                    --type "$PARAM_TYPE" > /dev/null
                print_ok "${PARAM_NAME} stored as ${PARAM_TYPE}"
            else
                echo -e "  ${DIM}Skipped. Set later with: secrets.sh set ${PARAM_NAME}${NC}"
            fi
        fi
    done 3< "$DEPLOY_SECRETS_FILE"
else
    print_warn "No deploy-secrets file found. Skipping secret setup."
    echo "  Create one from the example: cp deploy-secrets.example deploy-secrets"
    echo "  Then run: secrets.sh setup"
fi

# ══════════════════════════════════════════════════════════════════════════════
# Summary
# ══════════════════════════════════════════════════════════════════════════════
print_header "Setup Complete!"
echo ""
echo -e "  ${GREEN}${BOLD}All AWS resources created for ${APP_NAME}${NC}"
echo ""
echo "  Resources:"
echo "    ECR:        ${ECR_REPO}"
echo "    S3:         ${S3_BUCKET}"
echo "    ECS:        ${ECS_CLUSTER} / ${ECS_SERVICE}"
echo "    ALB:        http://${ALB_DNS}"
echo "    Logs:       ${LOG_GROUP}"
if [ -n "${GITHUB_REPO:-}" ]; then
    echo "    CodeBuild:  ${CODEBUILD_PROJECT}"
fi
echo "    SSM:        ${SSM_PREFIX}/*"
echo "    VPC:        ${VPC_ID} (${VPC_MODE})"
echo ""
echo "  Next steps:"
echo "    1. Set secrets: secrets.sh setup (or secrets.sh import file.values)"
echo "    2. Run: release-prepare.sh"
echo "    3. Run: deploy.sh <release-tag>"
echo ""
echo -e "  App URL: ${BOLD}http://${ALB_DNS}${NC}"
echo ""
