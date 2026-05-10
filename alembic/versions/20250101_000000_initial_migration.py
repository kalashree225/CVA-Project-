"""initial_migration

Revision ID: 20250101_000000
Revises: 
Create Date: 2025-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '20250101_000000'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create input_type enum
    input_type_enum = postgresql.ENUM('text', 'image', 'multimodal', name='inputtype', create_type=True)
    input_type_enum.create(op.get_bind())
    
    # Create run_status enum
    run_status_enum = postgresql.ENUM('pending', 'success', 'failed', name='runstatus', create_type=True)
    run_status_enum.create(op.get_bind())
    
    # Create alert_operator enum
    alert_operator_enum = postgresql.ENUM('gt', 'lt', 'eq', name='alertoperator', create_type=True)
    alert_operator_enum.create(op.get_bind())
    
    # Create media_type enum
    media_type_enum = postgresql.ENUM('image', 'audio', 'video', 'document', name='mediatype', create_type=True)
    media_type_enum.create(op.get_bind())
    
    # Create inference_runs table
    op.create_table(
        'inference_runs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('model_name', sa.String(100), nullable=False, index=True),
        sa.Column('input_type', input_type_enum, nullable=False, index=True),
        sa.Column('input_text', sa.Text(), nullable=True),
        sa.Column('input_image_url', sa.Text(), nullable=True),
        sa.Column('output_text', sa.Text(), nullable=False),
        sa.Column('latency_ms', sa.Integer(), nullable=False),
        sa.Column('token_count_input', sa.Integer(), nullable=False),
        sa.Column('token_count_output', sa.Integer(), nullable=False),
        sa.Column('cost_usd', sa.Float(), nullable=False),
        sa.Column('trace_id', sa.String(200), nullable=True, unique=True, index=True),
        sa.Column('hallucination_score', sa.Float(), nullable=True),
        sa.Column('status', run_status_enum, nullable=False, default='pending', index=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()'), index=True)
    )
    
    # Create evaluation_results table
    op.create_table(
        'evaluation_results',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('run_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('inference_runs.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('metric_name', sa.String(100), nullable=False),
        sa.Column('score', sa.Float(), nullable=False),
        sa.Column('explanation', sa.Text(), nullable=True),
        sa.Column('evaluated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()'))
    )
    
    # Create alert_rules table
    op.create_table(
        'alert_rules',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('metric', sa.String(100), nullable=False),
        sa.Column('operator', alert_operator_enum, nullable=False),
        sa.Column('threshold', sa.Float(), nullable=False),
        sa.Column('webhook_url', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True, index=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()'))
    )
    
    # Create alert_events table
    op.create_table(
        'alert_events',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('rule_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('alert_rules.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('triggered_value', sa.Float(), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('notified', sa.Boolean(), nullable=False, default=False),
        sa.Column('triggered_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()'), index=True)
    )
    
    # Create media_logs table
    op.create_table(
        'media_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('run_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('inference_runs.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('bucket', sa.String(100), nullable=False),
        sa.Column('object_key', sa.Text(), nullable=False),
        sa.Column('media_type', media_type_enum, nullable=False),
        sa.Column('size_bytes', sa.BigInteger(), nullable=False),
        sa.Column('uploaded_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()'))
    )


def downgrade() -> None:
    op.drop_table('media_logs')
    op.drop_table('alert_events')
    op.drop_table('alert_rules')
    op.drop_table('evaluation_results')
    op.drop_table('inference_runs')
    
    postgresql.ENUM(name='mediatype').drop(op.get_bind())
    postgresql.ENUM(name='alertoperator').drop(op.get_bind())
    postgresql.ENUM(name='runstatus').drop(op.get_bind())
    postgresql.ENUM(name='inputtype').drop(op.get_bind())
