from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from uuid import UUID
from app.models.user import UserRole


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: Optional[str] = None


class UserResponse(BaseModel):
    id: UUID
    email: str
    full_name: Optional[str]
    role: UserRole
    is_active: bool
    organization_id: Optional[UUID]
    created_at: datetime
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class OrganizationCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    data_retention_days: int = Field(90, ge=1, le=365)
    max_users: int = Field(10, ge=1, le=1000)


class OrganizationResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    description: Optional[str]
    is_active: bool
    data_retention_days: int
    max_users: int
    created_at: datetime
    
    class Config:
        from_attributes = True
