from datetime import datetime, timedelta
import importlib
import math
import uuid

from sqlalchemy import create_engine, select, func
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

# Create async engine
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20
)

# Synchronous engine for background threads (OpenCV loop)
# Strip 'async' prefix for standard sqlalchemy
SYNC_DB_URL = settings.DATABASE_URL.replace("sqlite+aiosqlite://", "sqlite://")
sync_engine = create_engine(SYNC_DB_URL)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

# Synchronous session factory
SessionLocal = sessionmaker(
    sync_engine,
    autocommit=False,
    autoflush=False
)

# Base class for models
Base = declarative_base()


async def get_db() -> AsyncSession:
    """Dependency for getting async database sessions."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    """Initialize database tables and local demo telemetry."""
    importlib.import_module("app.models")

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    await seed_local_demo_data()


async def seed_local_demo_data():
    """Keep the standalone app useful without Docker-only services."""
    from app.models.alert import AlertEvent, AlertOperator, AlertRule
    from app.models.organization import Organization
    from app.models.run import InferenceRun, InputType, RunStatus
    from app.models.user import User, UserRole
    from app.services.auth_service import AuthService

    async with AsyncSessionLocal() as session:
        existing_runs = await session.scalar(select(func.count(InferenceRun.id)))
        existing_user = await session.scalar(
            select(func.count(User.id)).where(User.email == "admin@sentinel.ai")
        )
        org_id = "sentinel-global-ops"

        if not existing_user:
            session.add(
                Organization(
                    id=org_id,
                    name="Sentinel Global Operations",
                    slug="sentinel-global-ops",
                    description="Local command-center organization for CVA monitoring.",
                    max_users=25,
                )
            )
            session.add(
                User(
                    id="sentinel-admin-user",
                    email="admin@sentinel.ai",
                    hashed_password=AuthService.get_password_hash("password"),
                    full_name="Director of Security Ops",
                    role=UserRole.ADMIN,
                    organization_id=org_id,
                )
            )

        if existing_runs:
            await session.commit()
            return

        now = datetime.utcnow()
        model_profiles = [
            ("llava-1.5", 930, 0.000008, InputType.IMAGE),
            ("gpt-4-vision", 1180, 0.000018, InputType.MULTIMODAL),
            ("claude-3-opus", 760, 0.000014, InputType.TEXT),
        ]

        for idx in range(288):
            created_at = now - timedelta(minutes=(288 - idx) * 5)
            model_name, base_latency, token_cost, input_type = model_profiles[idx % len(model_profiles)]
            hour_angle = (created_at.hour + created_at.minute / 60) / 24 * math.tau
            load_factor = 1 + 0.22 * math.sin(hour_angle - 0.8) + 0.08 * math.cos(idx / 9)
            incident_pressure = 1 if idx % 47 in (0, 1, 2) else 0
            latency = int(base_latency * load_factor + incident_pressure * 420 + (idx % 11) * 7)
            tokens_in = int(420 + (idx % 37) * 18 + load_factor * 90)
            tokens_out = int(130 + (idx % 23) * 11 + incident_pressure * 65)
            hallucination_score = min(
                0.96,
                max(0.01, 0.045 + (latency / 7000) + incident_pressure * 0.38 + 0.025 * math.sin(idx / 5)),
            )
            status = RunStatus.FAILED if incident_pressure and idx % 94 == 0 else RunStatus.SUCCESS
            total_tokens = tokens_in + tokens_out

            session.add(
                InferenceRun(
                    id=str(uuid.uuid4()),
                    model_name=model_name,
                    input_type=input_type,
                    input_text="Analyze perimeter telemetry and classify operational risk.",
                    input_image_url="/sentinel/local-frame" if input_type != InputType.TEXT else None,
                    output_text=(
                        "Risk elevated: crowding and latency pressure detected."
                        if incident_pressure
                        else "Operational signal is nominal; continue passive monitoring."
                    ),
                    latency_ms=latency,
                    token_count_input=tokens_in,
                    token_count_output=tokens_out,
                    cost_usd=round(total_tokens * token_cost, 6),
                    organization_id=org_id,
                    hallucination_score=round(hallucination_score, 4),
                    status=status,
                    created_at=created_at,
                )
            )

        rules = [
            AlertRule(
                id=str(uuid.uuid4()),
                name="Latency Spike Monitor",
                metric="latency_ms",
                operator=AlertOperator.GT,
                threshold=1500,
            ),
            AlertRule(
                id=str(uuid.uuid4()),
                name="Risk Confidence Guard",
                metric="hallucination_score",
                operator=AlertOperator.GT,
                threshold=0.45,
            ),
        ]
        session.add_all(rules)
        for offset, value, rule in [(35, 1734, rules[0]), (110, 0.61, rules[1]), (185, 1688, rules[0])]:
            session.add(
                AlertEvent(
                    id=str(uuid.uuid4()),
                    rule_id=rule.id,
                    triggered_value=value,
                    message=f"{rule.name} triggered during local telemetry replay.",
                    notified=False,
                    triggered_at=now - timedelta(minutes=offset),
                )
            )

        await session.commit()
