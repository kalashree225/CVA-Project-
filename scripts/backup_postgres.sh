#!/bin/bash
# PostgreSQL backup script for Vision + LLM Monitoring System

# Configuration
POSTGRES_HOST=${POSTGRES_HOST:-postgres}
POSTGRES_PORT=${POSTGRES_PORT:-5432}
POSTGRES_USER=${POSTGRES_USER:-vision_monitor}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-vision_monitor_pass}
POSTGRES_DB=${POSTGRES_DB:-vision_monitor}
BACKUP_DIR=${BACKUP_DIR:-/backups/postgres}
RETENTION_DAYS=${RETENTION_DAYS:-7}

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Generate backup filename with timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/postgres_backup_$TIMESTAMP.sql.gz"

echo "Starting PostgreSQL backup at $(date)"

# Perform backup
PGPASSWORD=$POSTGRES_PASSWORD pg_dump -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER $POSTGRES_DB | gzip > "$BACKUP_FILE"

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo "Backup completed successfully: $BACKUP_FILE"
    
    # Calculate backup size
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "Backup size: $BACKUP_SIZE"
else
    echo "Backup failed!"
    exit 1
fi

# Clean up old backups (keep only last N days)
echo "Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "postgres_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup process completed at $(date)"
