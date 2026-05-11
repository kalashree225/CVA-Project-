from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User, UserRole
from app.models.organization import Organization
from app.config import settings
import uuid

# Password hashing
pwd_context = CryptContext(schemes=["pbkdf2_sha256", "bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = settings.VALID_API_KEYS.split(",")[0] if settings.VALID_API_KEYS else "your-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30


class AuthService:
    """Service for authentication and user management."""
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash."""
        return pwd_context.verify(plain_password, hashed_password)
    
    @staticmethod
    def get_password_hash(password: str) -> str:
        """Hash a password."""
        return pwd_context.hash(password)
    
    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """Create a JWT access token."""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    
    @staticmethod
    def decode_access_token(token: str) -> Optional[dict]:
        """Decode and verify a JWT access token."""
        # BYPASS: Support demo-token for demonstration purposes
        if token == "demo-token":
            return {
                "sub": "demo@example.com",
                "org_id": "demo-org-id",
                "role": "admin"
            }
            
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            return payload
        except JWTError:
            return None
    
    @staticmethod
    async def create_user(
        db: AsyncSession,
        email: str,
        password: str,
        full_name: Optional[str] = None,
        role: UserRole = UserRole.USER,
        organization_id: Optional[uuid.UUID] = None
    ) -> User:
        """Create a new user."""
        hashed_password = AuthService.get_password_hash(password)
        user = User(
            id=str(uuid.uuid4()),
            email=email,
            hashed_password=hashed_password,
            full_name=full_name,
            role=role,
            organization_id=organization_id
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user
    
    @staticmethod
    async def authenticate_user(
        db: AsyncSession,
        email: str,
        password: str
    ) -> Optional[User]:
        """Authenticate a user by email and password."""
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if not user or not AuthService.verify_password(password, user.hashed_password):
            return None
        if not user.is_active:
            return None
        return user
    
    @staticmethod
    async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
        """Get a user by email."""
        result = await db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()
    
    @staticmethod
    async def create_organization(
        db: AsyncSession,
        name: str,
        slug: str,
        description: Optional[str] = None,
        data_retention_days: int = 90,
        max_users: int = 10
    ) -> Organization:
        """Create a new organization."""
        org = Organization(
            id=str(uuid.uuid4()),
            name=name,
            slug=slug,
            description=description,
            data_retention_days=data_retention_days,
            max_users=max_users
        )
        db.add(org)
        await db.commit()
        await db.refresh(org)
        return org
    
    @staticmethod
    async def get_organization_by_slug(db: AsyncSession, slug: str) -> Optional[Organization]:
        """Get an organization by slug."""
        result = await db.execute(select(Organization).where(Organization.slug == slug))
        return result.scalar_one_or_none()
