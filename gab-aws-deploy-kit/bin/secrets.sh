#!/bin/bash
# Manage SSM Parameter Store secrets for the application.
# Usage:
#   ./secrets.sh              # list all parameters
#   ./secrets.sh view         # show decrypted values
#   ./secrets.sh set VAR_NAME # update a secret
#   ./secrets.sh add VAR_NAME # add a new secret
#   ./secrets.sh delete VAR_NAME
#   ./secrets.sh setup        # interactive setup from deploy-secrets schema
#   ./secrets.sh import FILE  # bulk import from .env-style file

source "$(dirname "$0")/../lib/_common.sh"
source "$LIB_DIR/_task-def.sh"

ensure_aws_auth

# ── Restart ECS with updated secrets ─────────────────────────────────────────
_restart_with_updated_secrets() {
    print_step "Discovering SSM secrets..."
    local SSM_SECRETS
    SSM_SECRETS=$(discover_ssm_secrets)

    local SSM_COUNT
    SSM_COUNT=$(echo "$SSM_SECRETS" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))")
    print_ok "Found ${SSM_COUNT} SSM parameters to inject"

    print_step "Updating task definition with secrets..."
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
ssm_names = json.loads('''${SSM_SECRETS}''')
td['containerDefinitions'][0]['secrets'] = [
    {'name': p.split('/')[-1], 'valueFrom': p} for p in ssm_names
]
keep = ['family','containerDefinitions','taskRoleArn','executionRoleArn',
        'networkMode','volumes','placementConstraints','requiresCompatibilities',
        'cpu','memory','runtimePlatform']
print(json.dumps({k:v for k,v in td.items() if k in keep and v}))
")

    aws ecs register-task-definition \
        --cli-input-json "$NEW_TASK_DEF" \
        --query 'taskDefinition.taskDefinitionArn' \
        --output text > /dev/null

    aws ecs update-service \
        --cluster "$ECS_CLUSTER" \
        --service "$ECS_SERVICE" \
        --force-new-deployment > /dev/null 2>&1

    print_ok "Task definition updated and ECS tasks restarting..."
}

# ── Put a single SSM parameter ───────────────────────────────────────────────
_put_ssm_param() {
    local PARAM_NAME="$1"
    local PARAM_VALUE="$2"
    local OVERWRITE="${3:-false}"
    local FULL_NAME="${SSM_PREFIX}/${PARAM_NAME}"

    local PARAM_TYPE="SecureString"
    if [[ "$PARAM_NAME" == NEXT_PUBLIC_* ]]; then
        PARAM_TYPE="String"
    fi

    local EXTRA_FLAGS=""
    if [ "$OVERWRITE" = "true" ]; then
        EXTRA_FLAGS="--overwrite"
    fi

    aws ssm put-parameter \
        --name "$FULL_NAME" \
        --value "$PARAM_VALUE" \
        --type "$PARAM_TYPE" \
        $EXTRA_FLAGS > /dev/null

    print_ok "${PARAM_NAME} stored as ${PARAM_TYPE}"
}

ACTION="${1:-list}"
PARAM_NAME="${2:-}"

case "$ACTION" in
    list)
        print_header "SSM Parameters: ${SSM_PREFIX}/*"
        PARAMS=$(aws ssm describe-parameters \
            --parameter-filters "Key=Name,Option=BeginsWith,Values=${SSM_PREFIX}/" \
            --query 'Parameters[].{Name:Name,Type:Type,Modified:LastModifiedDate}' \
            --output json 2>/dev/null)

        if [ "$PARAMS" = "[]" ] || [ -z "$PARAMS" ]; then
            echo "  No parameters found."
            echo "  Add secrets with: secrets.sh add VARIABLE_NAME"
            echo "  Or bulk setup:    secrets.sh setup"
        else
            printf "  %-40s %-14s %s\n" "NAME" "TYPE" "LAST MODIFIED"
            printf "  %-40s %-14s %s\n" "----" "----" "-------------"
            echo "$PARAMS" | python3 -c "
import sys, json
params = json.load(sys.stdin)
for p in params:
    name = p['Name'].split('/')[-1]
    ptype = p['Type']
    modified = str(p['Modified'])[:19]
    print(f'  {name:<40} {ptype:<14} {modified}')
"
        fi
        echo ""
        echo -e "  ${DIM}Use 'secrets.sh view' to show decrypted values${NC}"
        ;;

    view)
        print_header "SSM Parameters (Decrypted): ${SSM_PREFIX}/*"
        echo ""
        echo -e "  ${YELLOW}[WARN] This will display secret values in plaintext.${NC}"
        echo -n "  Continue? (y/N): "
        read -r CONFIRM
        if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
            echo "  Cancelled."
            exit 0
        fi

        PARAMS=$(aws ssm get-parameters-by-path \
            --path "${SSM_PREFIX}/" \
            --with-decryption \
            --query 'Parameters[].{Name:Name,Value:Value,Type:Type}' \
            --output json 2>/dev/null)

        echo ""
        echo "$PARAMS" | python3 -c "
import sys, json
params = json.load(sys.stdin)
for p in params:
    name = p['Name'].split('/')[-1]
    value = p['Value']
    ptype = p['Type']
    if ptype == 'SecureString':
        masked = value[:3] + '***' + value[-3:] if len(value) > 6 else '***'
        print(f'  {name}={masked} ({ptype})')
    else:
        print(f'  {name}={value} ({ptype})')
"
        echo ""
        ;;

    set)
        if [ -z "$PARAM_NAME" ]; then
            print_error "Parameter name required."
            echo "  Usage: secrets.sh set VARIABLE_NAME"
            exit 1
        fi
        FULL_NAME="${SSM_PREFIX}/${PARAM_NAME}"

        echo -n "  Enter new value for ${PARAM_NAME}: "
        read -rs NEW_VALUE
        echo ""

        if [ -z "$NEW_VALUE" ]; then
            print_error "Value cannot be empty."
            exit 1
        fi

        _put_ssm_param "$PARAM_NAME" "$NEW_VALUE" "true"

        echo ""
        echo -n "  Update task definition and restart ECS tasks? (y/N): "
        read -r RESTART
        if [ "$RESTART" = "y" ] || [ "$RESTART" = "Y" ]; then
            _restart_with_updated_secrets
        fi
        ;;

    add)
        if [ -z "$PARAM_NAME" ]; then
            print_error "Parameter name required."
            echo "  Usage: secrets.sh add NEW_VARIABLE_NAME"
            exit 1
        fi
        FULL_NAME="${SSM_PREFIX}/${PARAM_NAME}"

        if aws ssm get-parameter --name "$FULL_NAME" > /dev/null 2>&1; then
            print_warn "${PARAM_NAME} already exists. Use 'set' to update."
            exit 1
        fi

        echo -n "  Enter value for ${PARAM_NAME}: "
        read -rs NEW_VALUE
        echo ""

        _put_ssm_param "$PARAM_NAME" "$NEW_VALUE"

        echo ""
        echo -n "  Update task definition and restart ECS tasks? (y/N): "
        read -r RESTART
        if [ "$RESTART" = "y" ] || [ "$RESTART" = "Y" ]; then
            _restart_with_updated_secrets
        fi
        ;;

    delete)
        if [ -z "$PARAM_NAME" ]; then
            print_error "Parameter name required."
            exit 1
        fi
        FULL_NAME="${SSM_PREFIX}/${PARAM_NAME}"

        confirm_action "Delete SSM parameter ${PARAM_NAME}" "$FULL_NAME"

        aws ssm delete-parameter --name "$FULL_NAME" 2>/dev/null
        print_ok "${PARAM_NAME} deleted"
        ;;

    setup)
        print_header "Interactive Secret Setup"

        if [ ! -f "$DEPLOY_SECRETS_FILE" ]; then
            print_error "No deploy-secrets file found at: ${DEPLOY_SECRETS_FILE}"
            echo "  Create one from the example: cp deploy-secrets.example deploy-secrets"
            exit 1
        fi

        echo "  Reading schema from: deploy-secrets"
        echo "  Press Enter to skip any parameter."
        echo ""

        ADDED=0
        SKIPPED=0
        EXISTED=0

        while IFS= read -r line <&3; do
            [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue

            PNAME=$(echo "$line" | cut -d'=' -f1 | tr -d '[:space:]')
            [ -z "$PNAME" ] && continue

            FULL_NAME="${SSM_PREFIX}/${PNAME}"
            if aws ssm get-parameter --name "$FULL_NAME" > /dev/null 2>&1; then
                print_ok "${PNAME} already set"
                EXISTED=$((EXISTED + 1))
            else
                echo -n "  Enter value for ${PNAME} (Enter to skip): "
                read -rs PVALUE < /dev/tty
                echo ""
                if [ -n "$PVALUE" ]; then
                    _put_ssm_param "$PNAME" "$PVALUE"
                    ADDED=$((ADDED + 1))
                else
                    echo -e "  ${DIM}Skipped${NC}"
                    SKIPPED=$((SKIPPED + 1))
                fi
            fi
        done 3< "$DEPLOY_SECRETS_FILE"

        echo ""
        print_ok "Setup complete: ${ADDED} added, ${EXISTED} already existed, ${SKIPPED} skipped"

        if [ "$ADDED" -gt 0 ]; then
            echo ""
            echo -n "  Update task definition and restart ECS tasks? (y/N): "
            read -r RESTART
            if [ "$RESTART" = "y" ] || [ "$RESTART" = "Y" ]; then
                _restart_with_updated_secrets
            fi
        fi
        ;;

    import)
        VALUES_FILE="${2:-}"
        if [ -z "$VALUES_FILE" ]; then
            print_error "Values file required."
            echo "  Usage: secrets.sh import deploy-secrets.values"
            echo "  File format: KEY=VALUE (one per line, # for comments)"
            exit 1
        fi

        if [ ! -f "$VALUES_FILE" ]; then
            # Try relative to kit dir
            if [ -f "${KIT_DIR}/${VALUES_FILE}" ]; then
                VALUES_FILE="${KIT_DIR}/${VALUES_FILE}"
            else
                print_error "File not found: ${VALUES_FILE}"
                exit 1
            fi
        fi

        print_header "Bulk Import Secrets"
        echo "  Reading from: ${VALUES_FILE}"
        echo ""

        IMPORTED=0
        UPDATED=0

        while IFS= read -r line; do
            [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue

            PNAME=$(echo "$line" | cut -d'=' -f1 | tr -d '[:space:]')
            PVALUE=$(echo "$line" | cut -d'=' -f2-)
            [ -z "$PNAME" ] || [ -z "$PVALUE" ] && continue

            FULL_NAME="${SSM_PREFIX}/${PNAME}"
            if aws ssm get-parameter --name "$FULL_NAME" > /dev/null 2>&1; then
                _put_ssm_param "$PNAME" "$PVALUE" "true"
                UPDATED=$((UPDATED + 1))
            else
                _put_ssm_param "$PNAME" "$PVALUE"
                IMPORTED=$((IMPORTED + 1))
            fi
        done < "$VALUES_FILE"

        echo ""
        print_ok "Import complete: ${IMPORTED} created, ${UPDATED} updated"

        if [ $((IMPORTED + UPDATED)) -gt 0 ]; then
            echo ""
            echo -n "  Update task definition and restart ECS tasks? (y/N): "
            read -r RESTART
            if [ "$RESTART" = "y" ] || [ "$RESTART" = "Y" ]; then
                _restart_with_updated_secrets
            fi
        fi
        ;;

    *)
        echo "Usage: secrets.sh [list|view|set|add|delete|setup|import] [PARAM_NAME|FILE]"
        echo ""
        echo "Commands:"
        echo "  list              List all SSM parameters (default)"
        echo "  view              Show decrypted values"
        echo "  set VAR_NAME      Update an existing secret"
        echo "  add VAR_NAME      Add a new secret"
        echo "  delete VAR_NAME   Delete a secret"
        echo "  setup             Interactive setup from deploy-secrets schema"
        echo "  import FILE       Bulk import from .env-style file"
        exit 1
        ;;
esac
