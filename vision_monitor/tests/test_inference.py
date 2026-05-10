import pytest
from httpx import AsyncClient
from app.main import app


@pytest.mark.asyncio
async def test_health_check():
    """Test health check endpoint."""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data


@pytest.mark.asyncio
async def test_register_user():
    """Test user registration."""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.post(
            "/api/v1/auth/register",
            json={
                "email": "test@example.com",
                "password": "testpassword123",
                "full_name": "Test User"
            }
        )
    assert response.status_code == 200
    data = response.json()
    assert "email" in data
    assert data["email"] == "test@example.com"


@pytest.mark.asyncio
async def test_login():
    """Test user login."""
    # First register a user
    async with AsyncClient(app=app, base_url="http://test") as ac:
        await ac.post(
            "/api/v1/auth/register",
            json={
                "email": "login@example.com",
                "password": "testpassword123"
            }
        )
    
    # Then login
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.post(
            "/api/v1/auth/login",
            data={
                "username": "login@example.com",
                "password": "testpassword123"
            }
        )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_inference_run_without_auth():
    """Test that inference run requires authentication."""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.post(
            "/api/v1/inference/run",
            json={
                "model": "llava-1.5",
                "input_type": "text",
                "text": "Test input"
            }
        )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_inference_run_with_auth():
    """Test inference run with authentication."""
    # Register and login
    async with AsyncClient(app=app, base_url="http://test") as ac:
        await ac.post(
            "/api/v1/auth/register",
            json={
                "email": "inference@example.com",
                "password": "testpassword123"
            }
        )
        
        login_response = await ac.post(
            "/api/v1/auth/login",
            data={
                "username": "inference@example.com",
                "password": "testpassword123"
            }
        )
        token = login_response.json()["access_token"]
    
    # Run inference with token
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.post(
            "/api/v1/inference/run",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "model": "llava-1.5",
                "input_type": "text",
                "text": "Test input"
            }
        )
    assert response.status_code == 200
    data = response.json()
    assert "run_id" in data
    assert "status" in data
