# Vision + LLM Monitoring System

A production-ready, enterprise-grade backend system for monitoring vision and LLM inference with comprehensive metrics, evaluation, alerting, and multi-tenant capabilities.

## Tech Stack

- **FastAPI** - Python 3.11 async web framework
- **PostgreSQL** - Primary database via SQLAlchemy async + Alembic migrations
- **InfluxDB 2.x** - Time-series metrics storage
- **Redis** - Caching and rate limiting
- **MinIO** - S3-compatible object storage for media
- **Pinecone** - Vector database for similarity search
- **Langfuse** - LLM tracing via HTTP API
- **Celery + Redis** - Async background task processing
- **Traefik** - Reverse proxy with HTTPS and Let's Encrypt
- **Prometheus** - Metrics collection and monitoring
- **Docker Compose** - Service orchestration

## Enterprise Features

### Authentication & Authorization
- **OAuth 2.0 Bearer Token Authentication** - Secure JWT-based authentication
- **User Management** - User registration, login, and role-based access control (Admin, User, Viewer)
- **Multi-Tenancy** - Organization isolation with configurable data retention policies
- **Audit Logging** - Comprehensive audit trail of all API requests stored in Redis

### Security
- **HTTPS/TLS** - Automatic SSL/TLS via Traefik with Let's Encrypt
- **Password Hashing** - Bcrypt-based secure password storage
- **Token Expiration** - Configurable JWT token expiration
- **Rate Limiting** - Redis-based rate limiting per user

### Monitoring & Observability
- **Prometheus Metrics** - Custom metrics for inference requests, latency, hallucination scores, alerts
- **Real-time Health Monitoring** - Health checks for all services with WebSocket streaming
- **Audit Logs** - Structured JSON audit logging for compliance

### Data Management
- **Automated Backups** - Daily scheduled backups for PostgreSQL and MinIO
- **Data Retention Policies** - Configurable per-organization data retention (default: 90 days)
- **Cleanup Tasks** - Automated cleanup of old data based on retention policies

### High Availability
- **Network Isolation** - Docker network for service communication
- **Health Checks** - Service health checks with automatic restart
- **Volume Persistence** - Persistent volumes for all data stores

## Features

1. **Multimodal Inference Endpoint** - Accept text, image, or multimodal inputs with simulated model inference
2. **Trace Logging** - Automatic Langfuse trace creation with spans for tokenize, inference, and post-process
3. **Performance Metrics** - Time-series metrics in InfluxDB (latency, tokens, cost, hallucination scores)
4. **Media Upload** - MinIO object storage with presigned URLs and automatic embedding generation
5. **Hallucination Evaluation** - Async Celery task for mock Ragas-style evaluation
6. **Vector Similarity Search** - Pinecone-based similarity search for finding similar past runs
7. **Data Drift Detection** - Statistical drift detection with baseline comparison
8. **Real-time Health Monitoring** - Health checks for all services with WebSocket streaming
9. **Alert Rules** - Configurable alert rules with webhook notifications
10. **Run History & Export** - Paginated run listing with CSV/JSON export
11. **User Authentication** - OAuth 2.0 with JWT tokens
12. **Organization Management** - Multi-tenant organization isolation
13. **Audit Logging** - Comprehensive API request logging
14. **Automated Backups** - Scheduled PostgreSQL and MinIO backups
15. **Prometheus Metrics** - Custom metrics for monitoring

## Project Structure

```
vision_monitor/
├── app/
│   ├── main.py               # FastAPI app entrypoint
│   ├── config.py             # Pydantic BaseSettings
│   ├── database.py           # Async SQLAlchemy engine
│   ├── models/               # SQLAlchemy ORM models
│   │   ├── run.py
│   │   ├── evaluation.py
│   │   ├── alert.py
│   │   ├── media.py
│   │   ├── user.py
│   │   └── organization.py
│   ├── schemas/              # Pydantic request/response schemas
│   │   ├── inference.py
│   │   ├── evaluation.py
│   │   ├── alert.py
│   │   ├── media.py
│   │   ├── metrics.py
│   │   ├── search.py
│   │   ├── health.py
│   │   └── user.py
│   ├── routers/              # FastAPI routers
│   │   ├── inference.py
│   │   ├── metrics.py
│   │   ├── evaluation.py
│   │   ├── media.py
│   │   ├── search.py
│   │   ├── alerts.py
│   │   ├── health.py
│   │   └── auth.py
│   ├── services/             # Business logic
│   │   ├── inference_service.py
│   │   ├── trace_service.py
│   │   ├── eval_service.py
│   │   ├── drift_service.py
│   │   ├── media_service.py
│   │   ├── vector_service.py
│   │   ├── metric_service.py
│   │   ├── alert_service.py
│   │   └── auth_service.py
│   ├── workers/
│   │   ├── tasks.py          # Celery tasks
│   │   └── cleanup_tasks.py # Data retention cleanup
│   └── middleware/           # Auth, rate limiting, audit logging
│       ├── auth.py
│       ├── rate_limit.py
│       ├── audit.py
│       └── prometheus.py
├── alembic/                  # DB migrations
├── scripts/                  # Backup scripts
│   ├── backup_postgres.sh
│   └── backup_minio.sh
├── traefik/                  # Traefik configuration
│   └── traefik.yml
├── prometheus/               # Prometheus configuration
│   └── prometheus.yml
├── docker-compose.yml
├── Dockerfile
├── requirements.txt
└── .env.example
```

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Pinecone API key (free tier)
- Langfuse account (free tier)

### Setup

1. **Clone the repository and navigate to the project directory**

2. **Configure environment variables**

```bash
cp .env.example .env
```

Edit `.env` and add your external service keys:
```
PINECONE_API_KEY=your-pinecone-api-key
LANGFUSE_PUBLIC_KEY=your-langfuse-public-key
LANGFUSE_SECRET_KEY=your-langfuse-secret-key
```

3. **Start all services with Docker Compose**

```bash
docker-compose up -d
```

This will start:
- Traefik (ports 80, 443, 8080) - Reverse proxy with HTTPS
- PostgreSQL (port 5432)
- Redis (port 6379)
- InfluxDB (port 8086)
- MinIO (ports 9000, 9001)
- Prometheus (port 9090)
- FastAPI app (port 8000, behind Traefik)
- Celery worker
- Backup scheduler

4. **Run database migrations**

```bash
docker-compose exec app alembic upgrade head
```

5. **Access the API**

- API: http://localhost:8000 (or https://localhost if using Traefik)
- Interactive docs: http://localhost:8000/docs
- Traefik Dashboard: http://localhost:8080
- Prometheus: http://localhost:9090
- MinIO Console: http://localhost:9001 (minioadmin/minioadmin)
- InfluxDB UI: http://localhost:8086 (admin/adminpassword)

## API Usage

### Authentication

The system now uses OAuth 2.0 Bearer token authentication instead of API keys.

#### Register a new user

```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123",
    "full_name": "John Doe"
  }'
```

This will create a new organization and user account with admin role.

#### Login to get access token

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=user@example.com&password=securepassword123"
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

#### Use the token for authenticated requests

```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  http://localhost:8000/api/v1/inference/run
```

### Example: Run Inference

```bash
curl -X POST http://localhost:8000/api/v1/inference/run \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llava-1.5",
    "input_type": "multimodal",
    "text": "Describe what you see in the image.",
    "image_url": "https://example.com/image.jpg"
  }'
```

Response:
```json
{
  "run_id": "uuid",
  "status": "pending",
  "trace_id": "langfuse-xxx"
}
```

### Example: Get Metrics Summary

```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  http://localhost:8000/api/v1/metrics/summary?hours=24
```

### Example: Create Alert Rule

```bash
curl -X POST http://localhost:8000/api/v1/alerts/rules \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "High hallucination",
    "metric": "hallucination_score",
    "operator": "gt",
    "threshold": 0.4,
    "webhook_url": "https://hooks.slack.com/..."
  }'
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login and get access token
- `GET /api/v1/auth/me` - Get current user information
- `POST /api/v1/auth/organizations` - Create a new organization (admin only)

### Inference
- `POST /api/v1/inference/run` - Run inference
- `GET /api/v1/inference/runs` - List runs (paginated, filtered)
- `GET /api/v1/inference/runs/{run_id}` - Get run details

### Metrics
- `GET /api/v1/metrics/summary` - Get metrics summary (last N hours)
- `GET /api/v1/metrics/timeseries` - Get time-series data
- `GET /metrics` - Prometheus metrics endpoint

### Evaluation
- `GET /api/v1/evaluation/{run_id}` - Get evaluation scores
- `POST /api/v1/evaluation/run/{run_id}` - Re-trigger evaluation

### Media
- `POST /api/v1/media/upload` - Upload media file
- `GET /api/v1/media/{media_id}/url` - Get presigned URL

### Search
- `POST /api/v1/search/similar` - Find similar runs

### Alerts
- `POST /api/v1/alerts/rules` - Create alert rule
- `GET /api/v1/alerts/rules` - List alert rules
- `DELETE /api/v1/alerts/rules/{rule_id}` - Delete alert rule
- `GET /api/v1/alerts/events` - List recent alert events

### Health
- `GET /api/v1/health` - Get health status
- `WS /api/v1/health/stream` - Real-time health streaming

### Drift
- `GET /api/v1/drift/report` - Get drift report
- `POST /api/v1/drift/baseline` - Set baseline

## Rate Limiting

- `/api/v1/inference/run`: 20 requests/minute per user
- All other routes: 100 requests/minute per user

Rate limiting is enforced using Redis with a token bucket algorithm.

## Development

### Running migrations

```bash
docker-compose exec app alembic upgrade head
```

### Creating new migrations

```bash
docker-compose exec app alembic revision --autogenerate -m "description"
```

### Viewing logs

```bash
docker-compose logs -f app
docker-compose logs -f worker
```

### Stopping services

```bash
docker-compose down
```

### Stopping services with volumes

```bash
docker-compose down -v
```

## External Services Setup

### Pinecone

1. Sign up at https://www.pinecone.io/
2. Create a new index named `vision-monitor-embeddings` with dimension 512
3. Copy your API key to `.env`

### Langfuse

1. Sign up at https://langfuse.com/
2. Create a new project
3. Copy public key and secret key to `.env`

## Database Schema

### organizations
- Stores organization information for multi-tenancy
- Includes data retention policies and user limits
- Relationships with users and inference runs

### users
- Stores user accounts with email, password, and role
- Roles: admin, user, viewer
- Linked to organizations for multi-tenancy

### inference_runs
- Stores all inference runs with model details, inputs, outputs, metrics, and evaluation status
- Now includes organization_id for multi-tenancy

### evaluation_results
- Stores individual evaluation metrics (faithfulness, answer_relevancy, context_recall)

### alert_rules
- Stores alert rule configurations

### alert_events
- Stores triggered alert events

### media_logs
- Stores media file uploads and their MinIO metadata

## Backups

### Automated Backups

The system includes automated daily backups for:

- **PostgreSQL**: Full database dumps stored in `/backups/postgres`
- **MinIO**: Bucket mirrors stored in `/backups/minio`

Backups are retained for 7 days by default (configurable via `RETENTION_DAYS` environment variable).

### Manual Backup

To manually trigger a backup:

```bash
docker-compose exec backup_scheduler /scripts/backup_postgres.sh
docker-compose exec backup_scheduler /scripts/backup_minio.sh
```

### Restore Backup

To restore PostgreSQL from a backup:

```bash
gunzip < /backups/postgres/postgres_backup_TIMESTAMP.sql.gz | docker-compose exec -T postgres psql -U vision_monitor vision_monitor
```

To restore MinIO from a backup:

```bash
tar -xzf /backups/minio/minio_backup_TIMESTAMP.tar.gz
mc mirror local_backup_dir minio/vision-monitor-media
```

## License

MIT
