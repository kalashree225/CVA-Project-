#!/bin/bash
# Automated metrics aggregation scheduler

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Colors for output
GREEN='\033[0;32m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

# Check if Python and required packages are installed
if ! command -v python3 &> /dev/null; then
    echo "Python 3 is not installed"
    exit 1
fi

# Run metrics aggregation
log_info "Running automated metrics aggregation pipeline"
cd "$PROJECT_DIR"
python3 pipelines/metrics_aggregation.py "$@"

log_info "Metrics aggregation completed"
