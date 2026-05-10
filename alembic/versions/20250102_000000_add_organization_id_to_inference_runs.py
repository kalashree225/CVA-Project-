"""add_organization_id_to_inference_runs

Revision ID: 20250102_000000
Revises: 20250101_000001
Create Date: 2025-01-02 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '20250102_000000'
down_revision = '20250101_000001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # organization_id was already added to inference_runs in migration 20250101_000001.
    # This migration is intentionally a no-op to preserve the revision chain.
    pass


def downgrade() -> None:
    pass
