#!/bin/bash
# VPC creation and discovery helpers.
# Sourced by setup.sh -- do not run directly.
#
# Supports three modes via VPC_MODE in deploy-config:
#   dedicated - Creates a new VPC per app (recommended for production)
#   shared    - Uses the default VPC (quick dev setups)
#   existing  - Uses VPC_ID from config
#
# All modes export:
#   VPC_ID, PUBLIC_SUBNET_IDS (comma-separated), PRIVATE_SUBNET_IDS (comma-separated)
#   ASSIGN_PUBLIC_IP ("ENABLED" or "DISABLED")

# ── Resolve VPC Based on Mode ────────────────────────────────────────────────
resolve_vpc() {
    print_header "VPC & Networking (mode: ${VPC_MODE})"

    case "$VPC_MODE" in
        dedicated)
            _create_dedicated_vpc
            ;;
        shared)
            _use_shared_vpc
            ;;
        existing)
            _use_existing_vpc
            ;;
        *)
            print_error "Unknown VPC_MODE: ${VPC_MODE}. Use: dedicated, shared, or existing."
            exit 1
            ;;
    esac

    print_ok "VPC: ${VPC_ID}"
    print_ok "Public subnets:  ${PUBLIC_SUBNET_IDS}"
    print_ok "Private subnets: ${PRIVATE_SUBNET_IDS}"
    print_ok "Assign public IP to tasks: ${ASSIGN_PUBLIC_IP}"
}

# ── Shared (Default VPC) ────────────────────────────────────────────────────
_use_shared_vpc() {
    echo "  Using default VPC."
    echo -e "  ${DIM}(Set VPC_MODE=dedicated in deploy-config for production isolation)${NC}"

    VPC_ID=$(aws ec2 describe-vpcs \
        --filters "Name=isDefault,Values=true" \
        --query 'Vpcs[0].VpcId' \
        --output text)

    if [ "$VPC_ID" = "None" ] || [ -z "$VPC_ID" ]; then
        print_error "No default VPC found. Use VPC_MODE=dedicated or VPC_MODE=existing."
        exit 1
    fi

    PUBLIC_SUBNET_IDS=$(aws ec2 describe-subnets \
        --filters "Name=vpc-id,Values=${VPC_ID}" \
        --query 'Subnets[?MapPublicIpOnLaunch==`true`].SubnetId' \
        --output text | tr '\t' ',')

    if [ -z "$PUBLIC_SUBNET_IDS" ]; then
        PUBLIC_SUBNET_IDS=$(aws ec2 describe-subnets \
            --filters "Name=vpc-id,Values=${VPC_ID}" \
            --query 'Subnets[0:2].SubnetId' \
            --output text | tr '\t' ',')
    fi

    # In shared mode, same subnets for both ALB and ECS (no private subnets)
    PRIVATE_SUBNET_IDS="$PUBLIC_SUBNET_IDS"
    ASSIGN_PUBLIC_IP="ENABLED"
}

# ── Existing VPC ─────────────────────────────────────────────────────────────
_use_existing_vpc() {
    if [ -z "${VPC_ID:-}" ]; then
        print_error "VPC_MODE=existing requires VPC_ID in deploy-config."
        exit 1
    fi

    echo "  Using existing VPC: ${VPC_ID}"

    # Discover public subnets (those with MapPublicIpOnLaunch)
    PUBLIC_SUBNET_IDS=$(aws ec2 describe-subnets \
        --filters "Name=vpc-id,Values=${VPC_ID}" "Name=tag:Tier,Values=public" \
        --query 'Subnets[].SubnetId' \
        --output text 2>/dev/null | tr '\t' ',')

    if [ -z "$PUBLIC_SUBNET_IDS" ]; then
        PUBLIC_SUBNET_IDS=$(aws ec2 describe-subnets \
            --filters "Name=vpc-id,Values=${VPC_ID}" "Name=map-public-ip-on-launch,Values=true" \
            --query 'Subnets[].SubnetId' \
            --output text | tr '\t' ',')
    fi

    # Discover private subnets (tagged Tier=private, or those without public IP)
    PRIVATE_SUBNET_IDS=$(aws ec2 describe-subnets \
        --filters "Name=vpc-id,Values=${VPC_ID}" "Name=tag:Tier,Values=private" \
        --query 'Subnets[].SubnetId' \
        --output text 2>/dev/null | tr '\t' ',')

    if [ -z "$PRIVATE_SUBNET_IDS" ]; then
        PRIVATE_SUBNET_IDS=$(aws ec2 describe-subnets \
            --filters "Name=vpc-id,Values=${VPC_ID}" "Name=map-public-ip-on-launch,Values=false" \
            --query 'Subnets[].SubnetId' \
            --output text | tr '\t' ',')
    fi

    if [ -z "$PRIVATE_SUBNET_IDS" ]; then
        print_warn "No private subnets found. ECS tasks will use public subnets."
        PRIVATE_SUBNET_IDS="$PUBLIC_SUBNET_IDS"
        ASSIGN_PUBLIC_IP="ENABLED"
    else
        ASSIGN_PUBLIC_IP="DISABLED"
    fi

    if [ -z "$PUBLIC_SUBNET_IDS" ]; then
        print_error "No public subnets found in VPC ${VPC_ID}."
        exit 1
    fi
}

# ── Dedicated VPC ────────────────────────────────────────────────────────────
_create_dedicated_vpc() {
    local VPC_TAG="${APP_NAME}-vpc"

    # Check if VPC already exists for this app
    VPC_ID=$(aws ec2 describe-vpcs \
        --filters "Name=tag:Name,Values=${VPC_TAG}" \
        --query 'Vpcs[0].VpcId' \
        --output text 2>/dev/null || echo "None")

    if [ "$VPC_ID" != "None" ] && [ -n "$VPC_ID" ]; then
        print_ok "Dedicated VPC already exists: ${VPC_ID}"
        _discover_dedicated_subnets
        ASSIGN_PUBLIC_IP="DISABLED"
        return
    fi

    echo "  Creating dedicated VPC: ${VPC_CIDR}"

    # Get two AZs in the region
    local AZ_A AZ_B
    AZ_A=$(aws ec2 describe-availability-zones \
        --query 'AvailabilityZones[0].ZoneName' --output text)
    AZ_B=$(aws ec2 describe-availability-zones \
        --query 'AvailabilityZones[1].ZoneName' --output text)

    # Derive subnet CIDRs from VPC CIDR base
    # VPC_CIDR = X.Y.0.0/16 => subnets use X.Y.{1,2,10,20}.0/24
    local CIDR_PREFIX
    CIDR_PREFIX=$(echo "$VPC_CIDR" | cut -d'.' -f1-2)
    local PUB_CIDR_A="${CIDR_PREFIX}.1.0/24"
    local PUB_CIDR_B="${CIDR_PREFIX}.2.0/24"
    local PRIV_CIDR_A="${CIDR_PREFIX}.10.0/24"
    local PRIV_CIDR_B="${CIDR_PREFIX}.20.0/24"

    # 1. Create VPC
    print_step "Creating VPC..."
    VPC_ID=$(aws ec2 create-vpc \
        --cidr-block "$VPC_CIDR" \
        --query 'Vpc.VpcId' \
        --output text)
    aws ec2 create-tags --resources "$VPC_ID" \
        --tags "Key=Name,Value=${VPC_TAG}" "Key=App,Value=${APP_NAME}"
    aws ec2 modify-vpc-attribute --vpc-id "$VPC_ID" --enable-dns-support '{"Value":true}'
    aws ec2 modify-vpc-attribute --vpc-id "$VPC_ID" --enable-dns-hostnames '{"Value":true}'
    print_ok "VPC created: ${VPC_ID}"

    # 2. Internet Gateway
    print_step "Creating Internet Gateway..."
    local IGW_ID
    IGW_ID=$(aws ec2 create-internet-gateway \
        --query 'InternetGateway.InternetGatewayId' \
        --output text)
    aws ec2 create-tags --resources "$IGW_ID" \
        --tags "Key=Name,Value=${APP_NAME}-igw" "Key=App,Value=${APP_NAME}"
    aws ec2 attach-internet-gateway --internet-gateway-id "$IGW_ID" --vpc-id "$VPC_ID"
    print_ok "IGW attached: ${IGW_ID}"

    # 3. Public Subnets
    print_step "Creating public subnets..."
    local PUB_SUB_A PUB_SUB_B
    PUB_SUB_A=$(aws ec2 create-subnet \
        --vpc-id "$VPC_ID" --cidr-block "$PUB_CIDR_A" --availability-zone "$AZ_A" \
        --query 'Subnet.SubnetId' --output text)
    aws ec2 create-tags --resources "$PUB_SUB_A" \
        --tags "Key=Name,Value=${APP_NAME}-public-a" "Key=Tier,Value=public" "Key=App,Value=${APP_NAME}"
    aws ec2 modify-subnet-attribute --subnet-id "$PUB_SUB_A" --map-public-ip-on-launch

    PUB_SUB_B=$(aws ec2 create-subnet \
        --vpc-id "$VPC_ID" --cidr-block "$PUB_CIDR_B" --availability-zone "$AZ_B" \
        --query 'Subnet.SubnetId' --output text)
    aws ec2 create-tags --resources "$PUB_SUB_B" \
        --tags "Key=Name,Value=${APP_NAME}-public-b" "Key=Tier,Value=public" "Key=App,Value=${APP_NAME}"
    aws ec2 modify-subnet-attribute --subnet-id "$PUB_SUB_B" --map-public-ip-on-launch

    PUBLIC_SUBNET_IDS="${PUB_SUB_A},${PUB_SUB_B}"
    print_ok "Public subnets: ${PUBLIC_SUBNET_IDS}"

    # 4. Public Route Table
    print_step "Configuring public route table..."
    local PUB_RT
    PUB_RT=$(aws ec2 create-route-table \
        --vpc-id "$VPC_ID" --query 'RouteTable.RouteTableId' --output text)
    aws ec2 create-tags --resources "$PUB_RT" \
        --tags "Key=Name,Value=${APP_NAME}-public-rt" "Key=App,Value=${APP_NAME}"
    aws ec2 create-route --route-table-id "$PUB_RT" \
        --destination-cidr-block "0.0.0.0/0" --gateway-id "$IGW_ID" > /dev/null
    aws ec2 associate-route-table --route-table-id "$PUB_RT" --subnet-id "$PUB_SUB_A" > /dev/null
    aws ec2 associate-route-table --route-table-id "$PUB_RT" --subnet-id "$PUB_SUB_B" > /dev/null
    print_ok "Public route table configured"

    # 5. NAT Gateway (in public subnet A, for private subnet outbound)
    print_step "Creating NAT Gateway (this takes ~2 min)..."
    local EIP_ALLOC
    EIP_ALLOC=$(aws ec2 allocate-address --domain vpc \
        --query 'AllocationId' --output text)
    aws ec2 create-tags --resources "$EIP_ALLOC" \
        --tags "Key=Name,Value=${APP_NAME}-nat-eip" "Key=App,Value=${APP_NAME}"

    local NAT_GW
    NAT_GW=$(aws ec2 create-nat-gateway \
        --subnet-id "$PUB_SUB_A" --allocation-id "$EIP_ALLOC" \
        --query 'NatGateway.NatGatewayId' --output text)
    aws ec2 create-tags --resources "$NAT_GW" \
        --tags "Key=Name,Value=${APP_NAME}-nat" "Key=App,Value=${APP_NAME}"

    echo -e "  ${DIM}Waiting for NAT Gateway to become available...${NC}"
    aws ec2 wait nat-gateway-available --nat-gateway-ids "$NAT_GW"
    print_ok "NAT Gateway ready: ${NAT_GW}"

    # 6. Private Subnets
    print_step "Creating private subnets..."
    local PRIV_SUB_A PRIV_SUB_B
    PRIV_SUB_A=$(aws ec2 create-subnet \
        --vpc-id "$VPC_ID" --cidr-block "$PRIV_CIDR_A" --availability-zone "$AZ_A" \
        --query 'Subnet.SubnetId' --output text)
    aws ec2 create-tags --resources "$PRIV_SUB_A" \
        --tags "Key=Name,Value=${APP_NAME}-private-a" "Key=Tier,Value=private" "Key=App,Value=${APP_NAME}"

    PRIV_SUB_B=$(aws ec2 create-subnet \
        --vpc-id "$VPC_ID" --cidr-block "$PRIV_CIDR_B" --availability-zone "$AZ_B" \
        --query 'Subnet.SubnetId' --output text)
    aws ec2 create-tags --resources "$PRIV_SUB_B" \
        --tags "Key=Name,Value=${APP_NAME}-private-b" "Key=Tier,Value=private" "Key=App,Value=${APP_NAME}"

    PRIVATE_SUBNET_IDS="${PRIV_SUB_A},${PRIV_SUB_B}"
    print_ok "Private subnets: ${PRIVATE_SUBNET_IDS}"

    # 7. Private Route Table (routes through NAT)
    print_step "Configuring private route table..."
    local PRIV_RT
    PRIV_RT=$(aws ec2 create-route-table \
        --vpc-id "$VPC_ID" --query 'RouteTable.RouteTableId' --output text)
    aws ec2 create-tags --resources "$PRIV_RT" \
        --tags "Key=Name,Value=${APP_NAME}-private-rt" "Key=App,Value=${APP_NAME}"
    aws ec2 create-route --route-table-id "$PRIV_RT" \
        --destination-cidr-block "0.0.0.0/0" --nat-gateway-id "$NAT_GW" > /dev/null
    aws ec2 associate-route-table --route-table-id "$PRIV_RT" --subnet-id "$PRIV_SUB_A" > /dev/null
    aws ec2 associate-route-table --route-table-id "$PRIV_RT" --subnet-id "$PRIV_SUB_B" > /dev/null
    print_ok "Private route table configured (outbound via NAT)"

    ASSIGN_PUBLIC_IP="DISABLED"
}

# ── Discover Subnets in Existing Dedicated VPC ───────────────────────────────
_discover_dedicated_subnets() {
    PUBLIC_SUBNET_IDS=$(aws ec2 describe-subnets \
        --filters "Name=vpc-id,Values=${VPC_ID}" "Name=tag:Tier,Values=public" \
        --query 'Subnets[].SubnetId' \
        --output text | tr '\t' ',')

    PRIVATE_SUBNET_IDS=$(aws ec2 describe-subnets \
        --filters "Name=vpc-id,Values=${VPC_ID}" "Name=tag:Tier,Values=private" \
        --query 'Subnets[].SubnetId' \
        --output text | tr '\t' ',')

    if [ -z "$PUBLIC_SUBNET_IDS" ] || [ -z "$PRIVATE_SUBNET_IDS" ]; then
        print_error "Could not discover subnets in dedicated VPC ${VPC_ID}."
        print_error "Expected subnets tagged Tier=public and Tier=private."
        exit 1
    fi
}
