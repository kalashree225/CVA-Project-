import pytest
import pytest_asyncio
import asyncio
import httpx
from app.main import app
from app.database import engine, Base, AsyncSessionLocal
from app.models import *


class AsyncClient(httpx.AsyncClient):
    """Compatibility shim for httpx versions that removed app=."""

    def __init__(self, *args, app=None, **kwargs):
        if app is not None and "transport" not in kwargs:
            kwargs["transport"] = httpx.ASGITransport(app=app)
        super().__init__(*args, **kwargs)


httpx.AsyncClient = AsyncClient


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="function", autouse=True)
async def db_session():
    """Create a fresh database session for each test."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    
    async with AsyncSessionLocal() as session:
        yield session
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def client():
    """Create an async test client."""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
