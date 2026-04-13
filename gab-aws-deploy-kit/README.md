# AWS Deploy Kit

Portable CI/CD toolkit for deploying containerized apps to AWS ECS Fargate.
Copy this folder into any project, configure two files, and you're ready to deploy.

## Quick Start

```bash
# 1. Configure your app
cp deploy-config.example deploy-config              # edit with your app name, AWS profile, region
cp deploy-secrets.example deploy-secrets            # list the secrets your app needs
cp deploy-build-args.example deploy-build-args      # NEXT_PUBLIC_* vars for docker build

# 2. Set up AWS infrastructure (one-time, idempotent)
./bin/setup.sh

# 3. Set up secrets (one-time)
./bin/secrets.sh import deploy-secrets.values   # bulk import from .values file
# -- or --
./bin/secrets.sh setup                          # interactive prompts

# 4. Deploy
./bin/release-prepare.sh    # local build + scans + push to ECR
./bin/deploy.sh release-xxx # deploy to ECS
```

## Folder Structure

```
aws-deploy-kit/
├── README.md
├── deploy-config.example      # Template -- copy to deploy-config
├── deploy-secrets.example     # Template -- copy to deploy-secrets
├── deploy-build-args.example  # Template -- copy to deploy-build-args
├── buildspec.yml              # CodeBuild build spec (optional)
├── lib/
│   ├── _common.sh             # Config loader, AWS auth, shared utilities
│   ├── _task-def.sh           # ECS task definition + deployment functions
│   └── _vpc.sh                # VPC creation/discovery (dedicated/shared/existing)
└── bin/
    ├── setup.sh               # One-time AWS infrastructure setup
    ├── teardown.sh            # Destroy all AWS resources
    ├── deploy.sh              # Deploy a release to ECS
    ├── rollback.sh            # Rollback to a previous release
    ├── secrets.sh             # Manage SSM Parameter Store secrets
    ├── release-prepare.sh     # Local build + scans + release notes
    ├── release-build.sh       # Remote build via CodeBuild
    ├── release-list.sh        # List available releases
    ├── compare-releases.sh    # Compare branches/tags
    ├── audit-history.sh       # View deploy/rollback audit trail
    ├── status.sh              # ECS service health dashboard
    ├── logs.sh                # Tail CloudWatch logs
    ├── docker-local.sh        # Build and run locally
    ├── security-scan.sh       # Quick local security scan
    └── generate-scan-report.sh
```

Per-project files (created by you, gitignored where needed):

| File | Committed? | Purpose |
|------|-----------|---------|
| `deploy-config` | No (gitignored) | Your app's AWS config |
| `deploy-secrets` | Yes | Secret schema (names only, no values) |
| `deploy-secrets.values` | No (gitignored) | Secret values for bulk import |
| `deploy-build-args` | No (gitignored) | `NEXT_PUBLIC_*` key=value pairs for docker build |

## Configuration Reference

### deploy-config

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `APP_NAME` | Yes | - | Unique name for all AWS resources |
| `PROFILE` | Yes | - | AWS SSO profile name |
| `AWS_REGION` | Yes | - | AWS region (e.g. `us-east-2`) |
| `APP_DIR` | No | `..` | Path to Dockerfile directory (relative to kit or absolute) |
| `CONTAINER_PORT` | No | `3000` | Port your container listens on |
| `VPC_MODE` | No | `shared` | `dedicated`, `shared`, or `existing` |
| `VPC_ID` | Only if existing | - | VPC ID when `VPC_MODE=existing` |
| `VPC_CIDR` | No | `10.1.0.0/16` | CIDR block for dedicated VPC |
| `MIN_TASKS` | No | `1` | Minimum ECS tasks |
| `MAX_TASKS` | No | `10` | Maximum ECS tasks |
| `TASK_CPU` | No | `512` | CPU units (256/512/1024/2048/4096) |
| `TASK_MEMORY` | No | `1024` | Memory in MB |
| `SCALE_UP_CPU` | No | `70` | CPU % threshold to scale out |
| `SCALE_DOWN_CPU` | No | `30` | CPU % threshold to scale in |
| `DEPLOYMENT_MIN_PERCENT` | No | `100` | Min healthy % during deploy |
| `DEPLOYMENT_MAX_PERCENT` | No | `200` | Max % during deploy |
| `HEALTH_CHECK_GRACE` | No | `60` | Seconds before health check |
| `HEALTH_CHECK_PATH` | No | `/` | ALB health check endpoint |
| `GITHUB_REPO` | No | - | GitHub repo for CodeBuild (owner/repo) |
| `CODESTAR_ARN` | No | - | CodeStar connection ARN |
| `TICKET_PATTERN` | No | `[A-Z]+-[0-9]+` | Regex for ticket IDs in commits |

## VPC Modes

### `dedicated` (recommended for production)

Creates a fully isolated VPC per app:
- 2 public subnets (ALB) across 2 AZs
- 2 private subnets (ECS tasks) across 2 AZs
- Internet Gateway for ALB
- NAT Gateway for outbound from private subnets
- ECS tasks have no public IP (traffic only via ALB)

```
VPC_MODE="dedicated"
VPC_CIDR="10.1.0.0/16"    # use different CIDRs for different apps
```

### `shared` (quick dev/testing)

Uses the default VPC. ECS tasks get public IPs. No network isolation between apps.

```
VPC_MODE="shared"
```

### `existing` (bring your own VPC)

Uses a pre-existing VPC. Discovers subnets by tags (`Tier=public`, `Tier=private`).

```
VPC_MODE="existing"
VPC_ID="vpc-0abc123def456789"
```

## Secrets Management

### Schema file (`deploy-secrets`)

Declares what secrets your app needs. Committed to git (no values, just names):

```
IGNATIUS_CLIENT_ID
IGNATIUS_PASSWORD
NEXT_PUBLIC_API_URL
OPENAI_API_KEY
```

### Commands

```bash
# Interactive setup (reads deploy-secrets, prompts for each value)
./bin/secrets.sh setup

# Bulk import from .env-style file
./bin/secrets.sh import deploy-secrets.values

# List all secrets
./bin/secrets.sh list

# View decrypted values
./bin/secrets.sh view

# Add/update/delete individual secrets
./bin/secrets.sh add MY_NEW_SECRET
./bin/secrets.sh set MY_EXISTING_SECRET
./bin/secrets.sh delete OLD_SECRET
```

Variables starting with `NEXT_PUBLIC_` are stored as plain `String`.
All others are stored as `SecureString` (encrypted at rest).

### Build-Time Args (`deploy-build-args`)

Next.js inlines `NEXT_PUBLIC_*` variables into the client JavaScript bundle at build time.
These cannot be injected at runtime via SSM -- they must be passed as `--build-arg` during `docker build`.

The `deploy-build-args` file holds these key=value pairs:

```
NEXT_PUBLIC_IGNATIUS_API_URL=https://api.ignatius.io
NEXT_PUBLIC_BASE_URL=https://ogc311.gab-test.com
```

`release-prepare.sh` and `docker-local.sh` read this file and pass each line as `--build-arg` to Docker.

## All Commands

| Command | Description |
|---------|-------------|
| `bin/setup.sh` | Create all AWS infrastructure (idempotent) |
| `bin/teardown.sh` | Destroy all AWS resources |
| `bin/deploy.sh <tag>` | Deploy a release to ECS |
| `bin/rollback.sh` | Interactive rollback to a previous release |
| `bin/secrets.sh [cmd]` | Manage SSM secrets (list/view/set/add/delete/setup/import) |
| `bin/release-prepare.sh` | Local build + scans + release notes |
| `bin/release-build.sh [tag]` | Trigger CodeBuild production build |
| `bin/release-list.sh` | List all releases (git tags + ECR) |
| `bin/compare-releases.sh` | Compare commits between branches/tags |
| `bin/audit-history.sh` | View deploy/rollback audit trail from S3 |
| `bin/status.sh` | ECS service health, tasks, scaling |
| `bin/logs.sh` | Tail CloudWatch logs |
| `bin/docker-local.sh` | Build and run container locally |
| `bin/security-scan.sh` | Quick local security scan |

## Deploying a New App

1. **Copy the kit** into your new project:
   ```bash
   cp -r aws-deploy-kit/ /path/to/new-project/aws-deploy-kit/
   ```

2. **Configure** for your app:
   ```bash
   cd /path/to/new-project/aws-deploy-kit/
   cp deploy-config.example deploy-config
   cp deploy-secrets.example deploy-secrets
   cp deploy-build-args.example deploy-build-args
   # Edit all three files for your app
   ```

3. **Set `APP_DIR`** to point to your Dockerfile:
   - `APP_DIR=".."` if Dockerfile is at the repo root
   - `APP_DIR="../my-app"` if it's in a subfolder

4. **Add to `.gitignore`**:
   ```
   aws-deploy-kit/deploy-config
   aws-deploy-kit/deploy-secrets
   aws-deploy-kit/deploy-build-args
   aws-deploy-kit/*.values
   ```

5. **Run setup and deploy**:
   ```bash
   ./bin/setup.sh                                  # create AWS infra
   ./bin/secrets.sh import deploy-secrets.values    # seed SSM secrets
   ./bin/release-prepare.sh                         # build + scan + push to ECR
   ./bin/deploy.sh release-xxx                      # deploy to ECS
   ```

## npm Scripts (optional)

If using from a `package.json` in a sibling directory:

```json
{
  "scripts": {
    "deploy": "bash ../aws-deploy-kit/bin/deploy.sh",
    "rollback": "bash ../aws-deploy-kit/bin/rollback.sh",
    "aws:setup": "bash ../aws-deploy-kit/bin/setup.sh",
    "aws:status": "bash ../aws-deploy-kit/bin/status.sh",
    "aws:logs": "bash ../aws-deploy-kit/bin/logs.sh",
    "aws:secrets": "bash ../aws-deploy-kit/bin/secrets.sh"
  }
}
```

## Requirements

- AWS CLI v2 with SSO configured
- Docker
- Python 3 (for JSON parsing in scripts)
- Node.js 20+ (for npm audit / eslint)
- Optional: [Trivy](https://aquasecurity.github.io/trivy/) for container scanning
