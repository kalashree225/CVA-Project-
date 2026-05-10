from locust import HttpUser, task, between
import random
import json


class VisionMonitorUser(HttpUser):
    """Load test user for Vision + LLM Monitoring System."""
    
    wait_time = between(1, 5)
    
    def on_start(self):
        """Called when a user starts. Login and get token."""
        # Register a new user
        email = f"loadtest{random.randint(10000, 99999)}@example.com"
        self.client.post(
            "/api/v1/auth/register",
            json={
                "email": email,
                "password": "loadtestpass123",
                "full_name": "Load Test User"
            }
        )
        
        # Login
        response = self.client.post(
            "/api/v1/auth/login",
            data={
                "username": email,
                "password": "loadtestpass123"
            }
        )
        
        if response.status_code == 200:
            self.token = response.json()["access_token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            self.token = None
            self.headers = {}
    
    @task(3)
    def run_inference(self):
        """Simulate inference requests."""
        if not self.token:
            return
        
        model = random.choice(["llava-1.5", "gpt-4-vision", "claude-3-opus"])
        input_type = random.choice(["text", "image", "multimodal"])
        
        payload = {
            "model": model,
            "input_type": input_type,
            "text": "Test input for load testing"
        }
        
        if input_type in ["image", "multimodal"]:
            payload["image_url"] = "https://example.com/test.jpg"
        
        self.client.post(
            "/api/v1/inference/run",
            headers=self.headers,
            json=payload
        )
    
    @task(2)
    def get_metrics_summary(self):
        """Get metrics summary."""
        if not self.token:
            return
        
        self.client.get(
            "/api/v1/metrics/summary?hours=24",
            headers=self.headers
        )
    
    @task(1)
    def get_inference_runs(self):
        """List inference runs."""
        if not self.token:
            return
        
        self.client.get(
            "/api/v1/inference/runs?limit=10",
            headers=self.headers
        )
    
    @task(1)
    def get_health(self):
        """Health check endpoint (no auth required)."""
        self.client.get("/api/v1/health")
    
    @task(1)
    def create_alert_rule(self):
        """Create alert rule."""
        if not self.token:
            return
        
        self.client.post(
            "/api/v1/alerts/rules",
            headers=self.headers,
            json={
                "name": f"Load Test Alert {random.randint(1000, 9999)}",
                "metric": "latency_ms",
                "operator": "gt",
                "threshold": random.uniform(1000, 5000)
            }
        )
    
    @task(1)
    def get_alert_events(self):
        """Get alert events."""
        if not self.token:
            return
        
        self.client.get(
            "/api/v1/alerts/events",
            headers=self.headers
        )
