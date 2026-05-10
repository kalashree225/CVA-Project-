# SSM Parameters for secrets
resource "aws_ssm_parameter" "pinecone_api_key" {
  name  = "/${var.project_name}/pinecone/api-key"
  type  = "SecureString"
  value = var.pinecone_api_key

  tags = {
    Name        = "${var.project_name}-pinecone-api-key"
    Environment = var.environment
  }
}

resource "aws_ssm_parameter" "langfuse_public_key" {
  name  = "/${var.project_name}/langfuse/public-key"
  type  = "SecureString"
  value = var.langfuse_public_key

  tags = {
    Name        = "${var.project_name}-langfuse-public-key"
    Environment = var.environment
  }
}

resource "aws_ssm_parameter" "langfuse_secret_key" {
  name  = "/${var.project_name}/langfuse/secret-key"
  type  = "SecureString"
  value = var.langfuse_secret_key

  tags = {
    Name        = "${var.project_name}-langfuse-secret-key"
    Environment = var.environment
  }
}

resource "aws_ssm_parameter" "db_password" {
  name  = "/${var.project_name}/database/password"
  type  = "SecureString"
  value = var.db_password

  tags = {
    Name        = "${var.project_name}-db-password"
    Environment = var.environment
  }
}

resource "aws_ssm_parameter" "redis_auth_token" {
  name  = "/${var.project_name}/redis/auth-token"
  type  = "SecureString"
  value = var.redis_auth_token

  tags = {
    Name        = "${var.project_name}-redis-auth-token"
    Environment = var.environment
  }
}
