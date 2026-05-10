import pytest
from httpx import AsyncClient
from app.main import app


@pytest.mark.asyncio
async def test_register_user_success():
    """Test successful user registration."""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.post(
            "/api/v1/auth/register",
            json={
                "email": "newuser@example.com",
                "password": "securepassword123",
                "full_name": "New User"
            }
        )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert data["full_name"] == "New User"
    assert data["is_active"] is True
    assert "id" in data


@pytest.mark.asyncio
async def test_register_duplicate_email():
    """Test registration with duplicate email fails."""
    email = "duplicate@example.com"
    
    # Register first user
    async with AsyncClient(app=app, base_url="http://test") as ac:
        await ac.post(
            "/api/v1/auth/register",
            json={
                "email": email,
                "password": "password123"
            }
        )
    
    # Try to register with same email
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.post(
            "/api/v1/auth/register",
            json={
                "email": email,
                "password": "differentpassword"
            }
        )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_login_success():
    """Test successful login."""
    email = "loginuser@example.com"
    password = "loginpassword123"
    
    # Register user
    async with AsyncClient(app=app, base_url="http://test") as ac:
        await ac.post(
            "/api/v1/auth/register",
            json={
                "email": email,
                "password": password
            }
        )
    
    # Login
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.post(
            "/api/v1/auth/login",
            data={
                "username": email,
                "password": password
            }
        )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_invalid_credentials():
    """Test login with invalid credentials fails."""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.post(
            "/api/v1/auth/login",
            data={
                "username": "nonexistent@example.com",
                "password": "wrongpassword"
            }
        )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_current_user():
    """Test getting current user info with valid token."""
    email = "currentuser@example.com"
    password = "userpassword123"
    
    # Register and login
    async with AsyncClient(app=app, base_url="http://test") as ac:
        await ac.post(
            "/api/v1/auth/register",
            json={
                "email": email,
                "password": password,
                "full_name": "Current User"
            }
        )
        
        login_response = await ac.post(
            "/api/v1/auth/login",
            data={
                "username": email,
                "password": password
            }
        )
        token = login_response.json()["access_token"]
    
    # Get current user
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == email
    assert data["full_name"] == "Current User"


@pytest.mark.asyncio
async def test_get_current_user_invalid_token():
    """Test getting current user with invalid token fails."""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer invalidtoken"}
        )
    assert response.status_code == 401
