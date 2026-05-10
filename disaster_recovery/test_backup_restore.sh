#!/bin/bash
# Automated disaster recovery testing script

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Test PostgreSQL backup and restore
test_postgres_dr() {
    log_info "Testing PostgreSQL disaster recovery..."
    
    # Create a test table with data
    docker-compose exec -T postgres psql -U vision_monitor -d vision_monitor <<EOF
CREATE TABLE IF NOT EXISTS dr_test (
    id SERIAL PRIMARY KEY,
    test_data VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);
INSERT INTO dr_test (test_data) VALUES ('DR Test Data');
EOF
    
    # Run backup
    log_info "Creating PostgreSQL backup..."
    docker-compose exec backup_scheduler /scripts/backup_postgres.sh
    
    # Drop the test table
    docker-compose exec -T postgres psql -U vision_monitor -d vision_monitor <<EOF
DROP TABLE IF EXISTS dr_test;
EOF
    
    # Restore from the latest backup
    log_info "Restoring PostgreSQL from backup..."
    LATEST_BACKUP=$(ls -t /backups/postgres/postgres_backup_*.sql.gz 2>/dev/null | head -1)
    
    if [ -z "$LATEST_BACKUP" ]; then
        log_error "No backup file found"
        return 1
    fi
    
    gunzip -c "$LATEST_BACKUP" | docker-compose exec -T postgres psql -U vision_monitor -d vision_monitor
    
    # Verify the test table exists
    TABLE_EXISTS=$(docker-compose exec -T postgres psql -U vision_monitor -d vision_monitor -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'dr_test')")
    
    if [ "$TABLE_EXISTS" = "t" ]; then
        log_info "PostgreSQL disaster recovery test PASSED"
        return 0
    else
        log_error "PostgreSQL disaster recovery test FAILED"
        return 1
    fi
}

# Test MinIO backup and restore
test_minio_dr() {
    log_info "Testing MinIO disaster recovery..."
    
    # Create a test file in MinIO
    TEST_FILE="/tmp/dr_test_file.txt"
    echo "DR Test Data" > "$TEST_FILE"
    
    docker-compose cp "$TEST_FILE" minio:/data/vision-monitor-media/dr_test_file.txt
    
    # Run backup
    log_info "Creating MinIO backup..."
    docker-compose exec backup_scheduler /scripts/backup_minio.sh
    
    # Delete the test file from MinIO
    docker-compose exec minio mc rm /data/vision-monitor-media/dr_test_file.txt
    
    # Restore from the latest backup
    log_info "Restoring MinIO from backup..."
    LATEST_BACKUP=$(ls -t /backups/minio/minio_backup_*.tar.gz 2>/dev/null | head -1)
    
    if [ -z "$LATEST_BACKUP" ]; then
        log_error "No backup file found"
        return 1
    fi
    
    # Extract and restore
    TEMP_DIR="/tmp/minio_restore"
    mkdir -p "$TEMP_DIR"
    tar -xzf "$LATEST_BACKUP" -C "$TEMP_DIR"
    docker-compose cp "$TEMP_DIR/vision-monitor-media/dr_test_file.txt" minio:/data/vision-monitor-media/
    
    # Verify the file exists
    FILE_EXISTS=$(docker-compose exec minio mc ls /data/vision-monitor-media/dr_test_file.txt 2>/dev/null | wc -l)
    
    if [ "$FILE_EXISTS" -gt 0 ]; then
        log_info "MinIO disaster recovery test PASSED"
        return 0
    else
        log_error "MinIO disaster recovery test FAILED"
        return 1
    fi
    
    rm -rf "$TEMP_DIR"
}

# Test service recovery
test_service_recovery() {
    log_info "Testing service recovery..."
    
    # Stop the app service
    log_info "Stopping app service..."
    docker-compose stop app
    
    # Wait a moment
    sleep 5
    
    # Check if service is down
    if docker-compose ps app | grep -q "Exit"; then
        log_info "App service stopped successfully"
    else
        log_warn "App service may not have stopped properly"
    fi
    
    # Start the app service
    log_info "Starting app service..."
    docker-compose start app
    
    # Wait for service to be healthy
    MAX_RETRIES=30
    RETRY_COUNT=0
    
    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/v1/health || echo "000")
        
        if [ "$HTTP_CODE" -eq 200 ]; then
            log_info "Service recovery test PASSED"
            return 0
        fi
        
        log_warn "Service not healthy yet (attempt $((RETRY_COUNT + 1))/$MAX_RETRIES)"
        sleep 5
        RETRY_COUNT=$((RETRY_COUNT + 1))
    done
    
    log_error "Service recovery test FAILED"
    return 1
}

# Generate DR test report
generate_report() {
    local postgres_result=$1
    local minio_result=$2
    local service_result=$3
    
    REPORT_FILE="disaster_recovery_report_$(date +%Y%m%d_%H%M%S).txt"
    
    {
        echo "Disaster Recovery Test Report"
        echo "============================="
        echo "Date: $(date)"
        echo ""
        echo "Test Results:"
        echo "-------------"
        echo "PostgreSQL Backup/Restore: $([ $postgres_result -eq 0 ] && echo "PASSED" || echo "FAILED")"
        echo "MinIO Backup/Restore: $([ $minio_result -eq 0 ] && echo "PASSED" || echo "FAILED")"
        echo "Service Recovery: $([ $service_result -eq 0 ] && echo "PASSED" || echo "FAILED")"
        echo ""
        echo "Overall Status: $([ $postgres_result -eq 0 ] && [ $minio_result -eq 0 ] && [ $service_result -eq 0 ] && echo "ALL TESTS PASSED" || echo "SOME TESTS FAILED")"
    } > "$REPORT_FILE"
    
    log_info "Report generated: $REPORT_FILE"
}

# Main function
main() {
    log_info "Starting automated disaster recovery testing"
    
    cd "$PROJECT_DIR"
    
    # Run tests
    test_postgres_dr
    POSTGRES_RESULT=$?
    
    test_minio_dr
    MINIO_RESULT=$?
    
    test_service_recovery
    SERVICE_RESULT=$?
    
    # Generate report
    generate_report $POSTGRES_RESULT $MINIO_RESULT $SERVICE_RESULT
    
    # Exit with appropriate code
    if [ $POSTGRES_RESULT -eq 0 ] && [ $MINIO_RESULT -eq 0 ] && [ $SERVICE_RESULT -eq 0 ]; then
        log_info "All disaster recovery tests PASSED"
        exit 0
    else
        log_error "Some disaster recovery tests FAILED"
        exit 1
    fi
}

main "$@"
