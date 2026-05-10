#!/bin/bash
# MinIO backup script for Vision + LLM Monitoring System

# Configuration
MINIO_ENDPOINT=${MINIO_ENDPOINT:-minio:9000}
MINIO_ACCESS_KEY=${MINIO_ACCESS_KEY:-minioadmin}
MINIO_SECRET_KEY=${MINIO_SECRET_KEY:-minioadmin}
MINIO_BUCKET=${MINIO_BUCKET:-vision-monitor-media}
BACKUP_DIR=${BACKUP_DIR:-/backups/minio}
RETENTION_DAYS=${RETENTION_DAYS:-7}

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Generate backup filename with timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/minio_backup_$TIMESTAMP.tar.gz"

echo "Starting MinIO backup at $(date)"

# Use mc (MinIO client) to backup the bucket
# First, configure mc
mc alias set minio http://$MINIO_ENDPOINT $MINIO_ACCESS_KEY $MINIO_SECRET_KEY

# Mirror bucket to local directory
TEMP_DIR="$BACKUP_DIR/temp_$TIMESTAMP"
mkdir -p "$TEMP_DIR"
mc mirror minio/$MINIO_BUCKET "$TEMP_DIR"

# Compress the backup
tar -czf "$BACKUP_FILE" -C "$TEMP_DIR" .

# Clean up temp directory
rm -rf "$TEMP_DIR"

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
find "$BACKUP_DIR" -name "minio_backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup process completed at $(date)"
