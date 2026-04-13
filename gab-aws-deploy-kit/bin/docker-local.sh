#!/bin/bash
# Build and run the Docker image locally for testing.

source "$(dirname "$0")/../lib/_common.sh"

require_cmd docker

print_header "Local Docker Build & Run"

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

cd "$APP_DIR"

print_step "Building Docker image..."
docker build --platform linux/amd64 "${BUILD_ARGS[@]}" -t "${APP_NAME}:local" .
print_ok "Image built: ${APP_NAME}:local"

echo ""
if [ -f ".env.local" ]; then
    print_step "Starting container with .env.local..."
    print_step "Press Ctrl+C to stop."
    echo ""
    docker run --rm -it --init \
        -p "${CONTAINER_PORT}:${CONTAINER_PORT}" \
        --env-file .env.local \
        --name "${APP_NAME}-local" \
        "${APP_NAME}:local"
else
    print_warn "No .env.local found. Starting without environment variables."
    echo "  Copy .env.example to .env.local and fill in values."
    echo ""
    docker run --rm -it --init \
        -p "${CONTAINER_PORT}:${CONTAINER_PORT}" \
        --name "${APP_NAME}-local" \
        "${APP_NAME}:local"
fi
