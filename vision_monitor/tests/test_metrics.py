import pytest
from httpx import AsyncClient
from app.main import app


@pytest.mark.asyncio
async def test_metrics_summary():
    """Test metrics summary endpoint."""
    # Register and login
    async with AsyncClient(app=app, base_url="http://test") as ac:
        await ac.post(
            "/api/v1/auth/register",
            json={
                "email": "metrics@example.com",
                "password": "testpassword123"
            }
        )
        
        login_response = await ac.post(
            "/api/v1/auth/login",
            data={
                "username": "metrics@example.com",
                "password": "testpassword123"
            }
        )
        token = login_response.json()["access_token"]
    
    # Get metrics summary
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get(
            "/api/v1/metrics/summary?hours=24",
            headers={"Authorization": f"Bearer {token}"}
        )
    assert response.status_code == 200
    data = response.json()
    assert "total_requests" in data
    assert "avg_latency_ms" in data


@pytest.mark.asyncio
async def test_metrics_timeseries():
    """Test metrics timeseries endpoint."""
    # Register and login
    async with AsyncClient(app=app, base_url="http://test") as ac:
        await ac.post(
            "/api/v1/auth/register",
            json={
                "email": "timeseries@example.com",
                "password": "testpassword123"
            }
        )
        
        login_response = await ac.post(
            "/api/v1/auth/login",
            data={
                "username": "timeseries@example.com",
                "password": "testpassword123"
            }
        )
        token = login_response.json()["access_token"]
    
    # Get timeseries data
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get(
            "/api/v1/metrics/timeseries?metric=latency_ms&hours=24",
            headers={"Authorization": f"Bearer {token}"}
        )
    assert response.status_code == 200
    data = response.json()
    assert "metric" in data
    assert "data_points" in data


@pytest.mark.asyncio
async def test_prometheus_metrics():
    """Test Prometheus metrics endpoint."""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/metrics")
    assert response.status_code == 200
    # Prometheus metrics should be in text format
    assert "text/plain" in response.headers.get("content-type", "")
