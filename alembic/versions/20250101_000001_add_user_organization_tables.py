"""add_user_organization_tables

Revision ID: 20250101_000001
Revises: 20250101_000000
Create Date: 2025-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '20250101_000001'
down_revision = '20250101_000000'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create user_role enum
    user_role_enum = postgresql.ENUM('admin', 'user', 'viewer', name='userrole', create_type=True)
    user_role_enum.create(op.get_bind())
    
    # Create organizations table
    op.create_table(
        'organizations',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('slug', sa.String(100), nullable=False, unique=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('data_retention_days', sa.Integer(), nullable=False, default=90),
        sa.Column('max_users', sa.Integer(), nullable=False, default=10),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()'))
    )
    
    # Create index on slug
    op.create_index('ix_organizations_slug', 'organizations', ['slug'])
    
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('email', sa.String(255), nullable=False, unique=True),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column('full_name', sa.String(255), nullable=True),
        sa.Column('role', user_role_enum, nullable=False, default='user'),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()'), onupdate=sa.text('NOW()'))
    )
    
    # Create indexes on users
    op.create_index('ix_users_email', 'users', ['email'])
    op.create_index('ix_users_organization_id', 'users', ['organization_id'])
    
    # Add organization_id to inference_runs for multi-tenancy
    op.add_column('inference_runs', sa.Column('organization_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=True))
    op.create_index('ix_inference_runs_organization_id', 'inference_runs', ['organization_id'])


def downgrade() -> None:
    # Remove organization_id from inference_runs
    op.drop_index('ix_inference_runs_organization_id', table_name='inference_runs')
    op.drop_column('inference_runs', 'organization_id')
    
    # Drop users table
    op.drop_index('ix_users_organization_id', table_name='users')
    op.drop_index('ix_users_email', table_name='users')
    op.drop_table('users')
    
    # Drop organizations table
    op.drop_index('ix_organizations_slug', table_name='organizations')
    op.drop_table('organizations')
    
    postgresql.ENUM(name='userrole').drop(op.get_bind())
