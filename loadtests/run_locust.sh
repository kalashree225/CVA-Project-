#!/bin/bash
# Automated load testing script using Locust

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Check if Locust is installed
if ! command -v locust &> /dev/null; then
    log_warn "Locust is not installed. Installing..."
    pip install locust
fi

# Parse arguments
ENVIRONMENT="${1:-dev}"
USERS="${2:-100}"
SPAWN_RATE="${3:-10}"
RUN_TIME="${4:-5m}"

# Set host based on environment
case $ENVIRONMENT in
    dev)
        HOST="http://localhost:8000"
        ;;
    staging)
        HOST="https://staging.example.com"
        ;;
    prod)
        HOST="https://api.example.com"
        ;;
    *)
        log_warn "Unknown environment: $ENVIRONMENT. Using localhost."
        HOST="http://localhost:8000"
        ;;
esac

log_info "Starting load test for environment: $ENVIRONMENT"
log_info "Host: $HOST"
log_info "Users: $USERS"
log_info "Spawn rate: $SPAWN_RATE"
log_info "Run time: $RUN_TIME"

# Run Locust
cd "$PROJECT_DIR/loadtests"
locust -f locustfile.py \
    --host="$HOST" \
    --users="$USERS" \
    --spawn-rate="$SPAWN_RATE" \
    --run-time="$RUN_TIME" \
    --headless \
    --html="locust-report-${ENVIRONMENT}-$(date +%Y%m%d-%H%M%S).html" \
    --csv="locust-stats-${ENVIRONMENT}-$(date +%Y%m%d-%H%M%S)" \
    --loglevel=INFO

log_info "Load test completed. Reports generated in loadtests directory."
