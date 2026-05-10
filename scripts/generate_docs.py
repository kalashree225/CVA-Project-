#!/usr/bin/env python3
"""
Automated documentation generation script for Vision + LLM Monitoring System.
This script generates API documentation, changelog, and updates the README.
"""

import os
import subprocess
import json
from datetime import datetime
from typing import List, Dict, Any
import re


class DocumentationGenerator:
    """Automated documentation generator."""
    
    def __init__(self):
        """Initialize the generator."""
        self.project_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.docs_dir = os.path.join(self.project_dir, "docs")
        os.makedirs(self.docs_dir, exist_ok=True)
    
    def generate_openapi_spec(self):
        """Generate OpenAPI specification from FastAPI."""
        print("Generating OpenAPI specification...")
        
        # Use the FastAPI built-in OpenAPI generator
        output_file = os.path.join(self.docs_dir, "openapi.json")
        
        # Run the app and export OpenAPI spec
        cmd = f"cd {self.project_dir} && python -c \"from vision_monitor.app.main import app; import json; json.dump(app.openapi(), open('{output_file}', 'w'))\""
        
        try:
            subprocess.run(cmd, shell=True, check=True)
            print(f"OpenAPI specification generated: {output_file}")
            return output_file
        except Exception as e:
            print(f"Error generating OpenAPI spec: {e}")
            return None
    
    def generate_api_docs(self):
        """Generate API documentation from OpenAPI spec."""
        print("Generating API documentation...")
        
        openapi_file = os.path.join(self.docs_dir, "openapi.json")
        
        if not os.path.exists(openapi_file):
            self.generate_openapi_spec()
        
        with open(openapi_file, 'r') as f:
            spec = json.load(f)
        
        # Generate markdown documentation
        md_content = f"# API Documentation\n\n"
        md_content += f"**Version:** {spec.get('info', {}).get('version', '1.0.0')}\n\n"
        md_content += f"{spec.get('info', {}).get('description', '')}\n\n"
        
        # List all endpoints
        md_content += "## Endpoints\n\n"
        
        for path, methods in spec.get('paths', {}).items():
            for method, details in methods.items():
                operation_id = details.get('operationId', 'unknown')
                summary = details.get('summary', details.get('description', ''))
                
                md_content += f"### {method.upper()} {path}\n\n"
                md_content += f"**Operation ID:** `{operation_id}`\n\n"
                md_content += f"{summary}\n\n"
                
                # Parameters
                parameters = details.get('parameters', [])
                if parameters:
                    md_content += "**Parameters:**\n\n"
                    for param in parameters:
                        param_name = param.get('name')
                        param_in = param.get('in')
                        param_type = param.get('schema', {}).get('type', 'string')
                        required = param.get('required', False)
                        md_content += f"- `{param_name}` ({param_in}, {param_type}" + (", required" if required else "") + ")\n"
                    md_content += "\n"
                
                # Request body
                request_body = details.get('requestBody')
                if request_body:
                    md_content += "**Request Body:**\n\n"
                    content = request_body.get('content', {})
                    for content_type, content_details in content.items():
                        md_content += f"Content-Type: {content_type}\n\n"
                        schema = content_details.get('schema', {})
                        md_content += f"```json\n{json.dumps(schema, indent=2)}\n```\n\n"
                
                # Responses
                responses = details.get('responses', {})
                if responses:
                    md_content += "**Responses:**\n\n"
                    for status_code, response_details in responses.items():
                        md_content += f"- **{status_code}**: {response_details.get('description', '')}\n"
                    md_content += "\n"
        
        output_file = os.path.join(self.docs_dir, "api_documentation.md")
        with open(output_file, 'w') as f:
            f.write(md_content)
        
        print(f"API documentation generated: {output_file}")
        return output_file
    
    def generate_changelog(self):
        """Generate changelog from git commits."""
        print("Generating changelog...")
        
        try:
            # Get git commits
            cmd = f"cd {self.project_dir} && git log --oneline --since=\"1 month ago\" --pretty=format:\"%h|%ad|%s|%an\" --date=short"
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True, check=True)
            
            commits = result.stdout.strip().split('\n') if result.stdout.strip() else []
            
            # Group commits by date
            commits_by_date = {}
            for commit in commits:
                parts = commit.split('|')
                if len(parts) >= 3:
                    hash_short, date, message = parts[0], parts[1], parts[2]
                    if date not in commits_by_date:
                        commits_by_date[date] = []
                    commits_by_date[date].append({
                        'hash': hash_short,
                        'message': message
                    })
            
            # Generate markdown changelog
            md_content = "# Changelog\n\n"
            md_content += "This document contains a record of all notable changes to the Vision + LLM Monitoring System.\n\n"
            
            for date in sorted(commits_by_date.keys(), reverse=True):
                md_content += f"## {date}\n\n"
                for commit in commits_by_date[date]:
                    md_content += f"- {commit['message']} ({commit['hash']})\n"
                md_content += "\n"
            
            output_file = os.path.join(self.project_dir, "CHANGELOG.md")
            with open(output_file, 'w') as f:
                f.write(md_content)
            
            print(f"Changelog generated: {output_file}")
            return output_file
            
        except Exception as e:
            print(f"Error generating changelog: {e}")
            return None
    
    def generate_architecture_docs(self):
        """Generate architecture documentation."""
        print("Generating architecture documentation...")
        
        md_content = """# Architecture Documentation

## System Overview

The Vision + LLM Monitoring System is a production-ready, enterprise-grade backend system for monitoring vision and LLM inference with comprehensive metrics, evaluation, alerting, and multi-tenant capabilities.

## Architecture Components

### Application Layer
- **FastAPI**: Python 3.11 async web framework
- **Uvicorn**: ASGI server for running FastAPI
- **Celery**: Distributed task queue for background processing

### Data Layer
- **PostgreSQL**: Primary database via SQLAlchemy async
- **InfluxDB**: Time-series metrics storage
- **Redis**: Caching, rate limiting, and Celery broker
- **MinIO**: S3-compatible object storage for media
- **Pinecone**: Vector database for similarity search

### External Integrations
- **Langfuse**: LLM tracing via HTTP API
- **Traefik**: Reverse proxy with HTTPS and Let's Encrypt
- **Prometheus**: Metrics collection and monitoring
- **Grafana**: Visualization and alerting

### Infrastructure
- **Docker Compose**: Local development orchestration
- **Terraform**: Infrastructure as Code for cloud deployment
- **AWS ECS**: Container orchestration in production
- **AWS RDS**: Managed PostgreSQL
- **AWS ElastiCache**: Managed Redis

## Data Flow

1. **Inference Request**: Client sends inference request via API
2. **Authentication**: OAuth 2.0 Bearer token validation
3. **Rate Limiting**: Redis-based rate limiting check
4. **Audit Logging**: Request logged to Redis
5. **Processing**: Inference processed and metrics collected
6. **Storage**: Results stored in PostgreSQL, metrics in InfluxDB
7. **Evaluation**: Async Celery task evaluates quality
8. **Alerting**: Alert rules evaluated and notifications sent

## Security

- OAuth 2.0 Bearer token authentication
- HTTPS/TLS with automatic certificate management
- Password hashing with bcrypt
- Role-based access control (Admin, User, Viewer)
- Multi-tenant organization isolation
- Audit logging for compliance

## Monitoring & Observability

- Prometheus metrics for all services
- Grafana dashboards for visualization
- Real-time health monitoring
- Automated alerting based on metrics thresholds
- Log aggregation via CloudWatch

## Scalability

- Horizontal scaling via ECS auto-scaling
- Database read replicas for query performance
- Redis clustering for high availability
- CDN for static assets
- Load balancing across availability zones

## Disaster Recovery

- Automated daily backups (PostgreSQL, MinIO)
- Multi-AZ deployment for high availability
- Automated backup verification
- Point-in-time recovery for RDS
- Backup retention policies

## Deployment

- CI/CD pipeline with GitHub Actions
- Automated testing and security scanning
- Blue-green deployments
- Health checks and automatic rollback
- Infrastructure as Code with Terraform
"""
        
        output_file = os.path.join(self.docs_dir, "architecture.md")
        with open(output_file, 'w') as f:
            f.write(md_content)
        
        print(f"Architecture documentation generated: {output_file}")
        return output_file
    
    def generate_deployment_docs(self):
        """Generate deployment documentation."""
        print("Generating deployment documentation...")
        
        md_content = """# Deployment Documentation

## Prerequisites

- Docker and Docker Compose installed
- AWS CLI configured (for production deployment)
- Terraform installed (for production deployment)
- Domain name configured (for production HTTPS)

## Local Development

### Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd CVA Project

# Configure environment variables
cp .env.example .env
# Edit .env with your configuration

# Start all services
docker-compose up -d

# Run database migrations
docker-compose exec app alembic upgrade head

# Access the API
open http://localhost:8000/docs
```

### Stopping Services

```bash
docker-compose down
```

### Stopping with Volume Cleanup

```bash
docker-compose down -v
```

## Production Deployment

### Infrastructure Setup

```bash
# Navigate to terraform directory
cd terraform

# Copy example variables
cp terraform.tfvars.example terraform.tfvars

# Edit terraform.tfvars with your values

# Initialize Terraform
terraform init

# Plan the deployment
terraform plan

# Apply the changes
terraform apply
```

### Application Deployment

```bash
# Build Docker image
docker build -t vision-monitor:latest .

# Push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
docker tag vision-monitor:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/vision-monitor-app:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/vision-monitor-app:latest

# Run deployment script
./scripts/deploy.sh prod
```

### CI/CD Deployment

The CI/CD pipeline automatically deploys to:
- **Development**: On push to `main` branch
- **Production**: On tag push matching `v*`

## Monitoring

### Access Monitoring Dashboards

- **Grafana**: https://monitoring.example.com
- **Prometheus**: https://prometheus.example.com
- **Traefik Dashboard**: https://traefik.example.com

### Alert Configuration

Alerts are configured in `grafana/alerts/alert_rules.yml`.

## Backup & Restore

### Manual Backup

```bash
docker-compose exec backup_scheduler /scripts/backup_postgres.sh
docker-compose exec backup_scheduler /scripts/backup_minio.sh
```

### Restore PostgreSQL

```bash
gunzip < /backups/postgres/postgres_backup_TIMESTAMP.sql.gz | docker-compose exec -T postgres psql -U vision_monitor vision_monitor
```

## Troubleshooting

### Check Service Status

```bash
docker-compose ps
docker-compose logs -f app
```

### Database Connection Issues

```bash
docker-compose exec postgres psql -U vision_monitor -d vision_monitor
```

### Redis Connection Issues

```bash
docker-compose exec redis redis-cli ping
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f worker
```
"""
        
        output_file = os.path.join(self.docs_dir, "deployment.md")
        with open(output_file, 'w') as f:
            f.write(md_content)
        
        print(f"Deployment documentation generated: {output_file}")
        return output_file
    
    def generate_all(self):
        """Generate all documentation."""
        print("Starting automated documentation generation...")
        
        results = {
            'openapi': self.generate_openapi_spec(),
            'api_docs': self.generate_api_docs(),
            'changelog': self.generate_changelog(),
            'architecture': self.generate_architecture_docs(),
            'deployment': self.generate_deployment_docs()
        }
        
        print("\nDocumentation generation complete!")
        print("Generated files:")
        for doc_type, file_path in results.items():
            if file_path:
                print(f"  - {doc_type}: {file_path}")
        
        return results


if __name__ == "__main__":
    import sys
    
    generator = DocumentationGenerator()
    
    if len(sys.argv) > 1:
        doc_type = sys.argv[1]
        
        if doc_type == "openapi":
            generator.generate_openapi_spec()
        elif doc_type == "api":
            generator.generate_api_docs()
        elif doc_type == "changelog":
            generator.generate_changelog()
        elif doc_type == "architecture":
            generator.generate_architecture_docs()
        elif doc_type == "deployment":
            generator.generate_deployment_docs()
        else:
            print(f"Unknown documentation type: {doc_type}")
            print("Available types: openapi, api, changelog, architecture, deployment")
    else:
        generator.generate_all()
