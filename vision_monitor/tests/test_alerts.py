import pytest
from httpx import AsyncClient
from app.main import app


@pytest.mark.asyncio
async def test_create_alert_rule():
    """Test creating an alert rule."""
    # Register and login
    async with AsyncClient(app=app, base_url="http://test") as ac:
        await ac.post(
            "/api/v1/auth/register",
            json={
                "email": "alerts@example.com",
                "password": "testpassword123"
            }
        )
        
        login_response = await ac.post(
            "/api/v1/auth/login",
            data={
                "username": "alerts@example.com",
                "password": "testpassword123"
            }
        )
        token = login_response.json()["access_token"]
    
    # Create alert rule
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.post(
            "/api/v1/alerts/rules",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "name": "High Latency Alert",
                "metric": "latency_ms",
                "operator": "gt",
                "threshold": 5000.0,
                "webhook_url": "https://hooks.slack.com/test"
            }
        )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "High Latency Alert"
    assert data["metric"] == "latency_ms"


@pytest.mark.asyncio
async def test_list_alert_rules():
    """Test listing alert rules."""
    # Register and login
    async with AsyncClient(app=app, base_url="http://test") as ac:
        await ac.post(
            "/api/v1/auth/register",
            json={
                "email": "listalerts@example.com",
                "password": "testpassword123"
            }
        )
        
        login_response = await ac.post(
            "/api/v1/auth/login",
            data={
                "username": "listalerts@example.com",
                "password": "testpassword123"
            }
        )
        token = login_response.json()["access_token"]
    
    # Create an alert rule
    async with AsyncClient(app=app, base_url="http://test") as ac:
        await ac.post(
            "/api/v1/alerts/rules",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "name": "Test Alert",
                "metric": "latency_ms",
                "operator": "gt",
                "threshold": 1000.0
            }
        )
    
    # List alert rules
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get(
            "/api/v1/alerts/rules",
            headers={"Authorization": f"Bearer {token}"}
        )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_delete_alert_rule():
    """Test deleting an alert rule."""
    # Register and login
    async with AsyncClient(app=app, base_url="http://test") as ac:
        await ac.post(
            "/api/v1/auth/register",
            json={
                "email": "deletealerts@example.com",
                "password": "testpassword123"
            }
        )
        
        login_response = await ac.post(
            "/api/v1/auth/login",
            data={
                "username": "deletealerts@example.com",
                "password": "testpassword123"
            }
        )
        token = login_response.json()["access_token"]
    
    # Create an alert rule
    async with AsyncClient(app=app, base_url="http://test") as ac:
        create_response = await ac.post(
            "/api/v1/alerts/rules",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "name": "Delete Test",
                "metric": "latency_ms",
                "operator": "gt",
                "threshold": 1000.0
            }
        )
        rule_id = create_response.json()["id"]
    
    # Delete the alert rule
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.delete(
            f"/api/v1/alerts/rules/{rule_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_list_alert_events():
    """Test listing alert events."""
    # Register and login
    async with AsyncClient(app=app, base_url="http://test") as ac:
        await ac.post(
            "/api/v1/auth/register",
            json={
                "email": "events@example.com",
                "password": "testpassword123"
            }
        )
        
        login_response = await ac.post(
            "/api/v1/auth/login",
            data={
                "username": "events@example.com",
                "password": "testpassword123"
            }
        )
        token = login_response.json()["access_token"]
    
    # List alert events
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get(
            "/api/v1/alerts/events",
            headers={"Authorization": f"Bearer {token}"}
        )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
