#!/bin/bash
# Automated deployment script for Vision + LLM Monitoring System

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENVIRONMENT="${1:-dev}"
TERRAFORM_DIR="$PROJECT_DIR/terraform"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v terraform &> /dev/null; then
        log_error "Terraform is not installed"
        exit 1
    fi
    
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed"
        exit 1
    fi
    
    log_info "All prerequisites are met"
}

# Build Docker image
build_image() {
    log_info "Building Docker image..."
    cd "$PROJECT_DIR"
    docker build -t vision-monitor:latest .
    log_info "Docker image built successfully"
}

# Push to ECR
push_to_ecr() {
    log_info "Pushing Docker image to ECR..."
    
    # Get ECR login token
    aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com
    
    # Tag and push
    ECR_URI=$(aws ecr describe-repositories --repository-names vision-monitor-app --query repositories[0].repositoryUri --output text)
    docker tag vision-monitor:latest "$ECR_URI:latest"
    docker push "$ECR_URI:latest"
    
    log_info "Image pushed to ECR successfully"
}

# Deploy infrastructure with Terraform
deploy_infrastructure() {
    log_info "Deploying infrastructure with Terraform..."
    cd "$TERRAFORM_DIR"
    
    # Initialize Terraform
    terraform init
    
    # Validate configuration
    terraform validate
    
    # Plan deployment
    terraform plan -out=tfplan -var-file="terraform.tfvars"
    
    # Apply changes
    terraform apply -auto-approve tfplan
    
    log_info "Infrastructure deployed successfully"
}

# Run database migrations
run_migrations() {
    log_info "Running database migrations..."
    
    # Get ECS cluster and task information
    CLUSTER_NAME="vision-monitor-${ENVIRONMENT}-cluster"
    TASK_DEF_FAMILY="vision-monitor-app"
    
    # Execute migrations via ECS run task
    aws ecs run-task \
        --cluster "$CLUSTER_NAME" \
        --task-definition "$TASK_DEF_FAMILY" \
        --launch-type FARGATE \
        --network-configuration "awsvpcConfiguration={subnets=$(aws ec2 describe-subnets --filters Name=tag:Environment,Values=${ENVIRONMENT} --query 'Subnets[0].SubnetId' --output text),securityGroups=$(aws ec2 describe-security-groups --filters Name=tag:Environment,Values=${ENVIRONMENT} --query 'SecurityGroups[0].GroupId' --output text),assignPublicIp=DISABLED}" \
        --overrides "containerOverrides=[{name=app,command=[\"alembic\",\"upgrade\",\"head\"]}]"
    
    log_info "Database migrations completed"
}

# Health check
health_check() {
    log_info "Performing health check..."
    
    # Get load balancer DNS
    ALB_DNS=$(terraform output -raw load_balancer_dns 2>/dev/null || echo "")
    
    if [ -z "$ALB_DNS" ]; then
        log_error "Could not get load balancer DNS"
        exit 1
    fi
    
    # Wait for health check to pass
    MAX_RETRIES=30
    RETRY_COUNT=0
    
    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://$ALB_DNS/api/v1/health")
        
        if [ "$HTTP_CODE" -eq 200 ]; then
            log_info "Health check passed"
            return 0
        fi
        
        log_warn "Health check failed (attempt $((RETRY_COUNT + 1))/$MAX_RETRIES)"
        sleep 10
        RETRY_COUNT=$((RETRY_COUNT + 1))
    done
    
    log_error "Health check failed after $MAX_RETRIES attempts"
    exit 1
}

# Rollback on failure
rollback() {
    log_error "Deployment failed, initiating rollback..."
    cd "$TERRAFORM_DIR"
    terraform apply -auto-approve -refresh=false tfplan.backup
    log_info "Rollback completed"
}

# Main deployment function
main() {
    log_info "Starting deployment for environment: $ENVIRONMENT"
    
    # Backup current Terraform plan
    cd "$TERRAFORM_DIR"
    if [ -f tfplan ]; then
        cp tfplan tfplan.backup
    fi
    
    # Execute deployment steps
    check_prerequisites
    build_image
    push_to_ecr
    deploy_infrastructure
    run_migrations
    health_check
    
    log_info "Deployment completed successfully!"
    
    # Output important information
    log_info "Load Balancer DNS: $(terraform output -raw load_balancer_dns)"
    log_info "ECS Cluster: $(terraform output -raw ecs_cluster_id)"
}

# Trap errors for rollback
trap rollback ERR

# Run main function
main "$@"
