output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "ecs_cluster_id" {
  description = "ECS Cluster ID"
  value       = aws_ecs_cluster.main.id
}

output "ecs_service_name" {
  description = "ECS Service Name"
  value       = aws_ecs_service.app.name
}

output "load_balancer_dns" {
  description = "Load Balancer DNS Name"
  value       = aws_lb.app.dns_name
}

output "load_balancer_zone_id" {
  description = "Load Balancer Zone ID"
  value       = aws_lb.app.zone_id
}

output "rds_endpoint" {
  description = "RDS Endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "redis_endpoint" {
  description = "Redis Endpoint"
  value       = aws_elasticache_replication_group.main.primary_endpoint_address
  sensitive   = true
}

output "ecr_repository_url" {
  description = "ECR Repository URL"
  value       = aws_ecr_repository.app.repository_url
}

output "s3_media_bucket" {
  description = "S3 Media Bucket Name"
  value       = aws_s3_bucket.media.id
}

output "s3_logs_bucket" {
  description = "S3 Logs Bucket Name"
  value       = aws_s3_bucket.logs.id
}
