from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi import Response
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.database import get_db
from app.services.auth_service import AuthService, ACCESS_TOKEN_EXPIRE_MINUTES
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserResponse, Token, OrganizationCreate, OrganizationResponse
from app.config import settings
from pydantic import BaseModel, EmailStr

router = APIRouter(prefix="/api/v1/auth", tags=["authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    organization_slug: Optional[str] = None


@router.post("/register", response_model=UserResponse)
async def register(
    request: RegisterRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Register a new user.
    If organization_slug is provided, join existing organization.
    Otherwise, create a new organization with the user as admin.
    """
    # Check if user already exists
    existing_user = await AuthService.get_user_by_email(db, request.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    organization_id = None
    role = UserRole.USER
    
    if request.organization_slug:
        # Join existing organization
        org = await AuthService.get_organization_by_slug(db, request.organization_slug)
        if not org:
            raise HTTPException(status_code=404, detail="Organization not found")
        organization_id = org.id
    else:
        # Create new organization
        org = await AuthService.create_organization(
            db,
            name=f"{request.email.split('@')[0]}'s Organization",
            slug=request.email.split('@')[0].lower(),
            description="Default organization"
        )
        organization_id = org.id
        role = UserRole.ADMIN
    
    user = await AuthService.create_user(
        db,
        email=request.email,
        password=request.password,
        full_name=request.full_name,
        role=role,
        organization_id=organization_id
    )
    
    return user


@router.post("/login", response_model=Token)
async def login(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """
    Login with email and password.
    Returns JWT access token and sets an httpOnly cookie.
    """
    user = await AuthService.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = AuthService.create_access_token(
        data={"sub": str(user.id), "email": user.email, "role": user.role.value},
        expires_delta=access_token_expires
    )
    
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=settings.JWT_EXPIRE_MINUTES * 60,
    )
    
    return Token(access_token=access_token, token_type="bearer")


@router.post("/logout")
async def logout(response: Response):
    """
    Logout the current user by clearing the access token cookie.
    """
    response.delete_cookie(key="access_token")
    return {"message": "Logged out"}


@router.get("/me", response_model=UserResponse)
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    """
    Get current user information.
    """
    payload = AuthService.decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user


@router.post("/organizations", response_model=OrganizationResponse)
async def create_organization(
    request: OrganizationCreate,
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new organization.
    Requires admin role.
    """
    payload = AuthService.decode_access_token(token)
    if not payload or payload.get("role") != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Admin role required")
    
    org = await AuthService.create_organization(
        db,
        name=request.name,
        slug=request.slug,
        description=request.description,
        data_retention_days=request.data_retention_days,
        max_users=request.max_users
    )
    
    return org
