import os
import sys
import uuid
import random
import json
import asyncio
from datetime import datetime, timedelta
import redis
import asyncpg
import math

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Mock settings/env for standalone run
DATABASE_URL = "postgresql://vision_monitor:vision_monitor_pass@localhost:5432/vision_monitor"
REDIS_URL = "redis://localhost:6379/0"

MODELS = [
    {"name": "GPT-4o", "latency_range": (300, 800), "cost_per_1k": 0.01},
    {"name": "LLaVA-1.5", "latency_range": (800, 2500), "cost_per_1k": 0.005},
    {"name": "Claude-3-Opus", "latency_range": (500, 1500), "cost_per_1k": 0.015},
    {"name": "Llama-3-70b", "latency_range": (200, 600), "cost_per_1k": 0.002},
]

async def seed_data(num_runs=500):
    print(f"Starting raw seeding of {num_runs} realistic inference runs...")
    
    # Setup Redis for live streaming simulation
    r = redis.Redis.from_url(REDIS_URL)
    
    # Connect to DB
    conn = await asyncpg.connect(DATABASE_URL)
    
    org_id = uuid.UUID("demo-org-id")

    try:
        for i in range(num_runs):
            model = random.choice(MODELS)
            
            # Simulate hourly load patterns (more traffic during day)
            current_time = datetime.utcnow() - timedelta(minutes=random.randint(0, 1440))
            hour = current_time.hour
            load_factor = 1.0 + (math.sin((hour - 8) * math.pi / 12) + 1.0) / 2.0
            
            latency = int(random.randint(*model["latency_range"]) * load_factor)
            tokens_in = random.randint(50, 1000)
            tokens_out = random.randint(100, 2000)
            cost = ((tokens_in + tokens_out) / 1000) * model["cost_per_1k"]
            
            has_anomaly = random.random() < 0.05
            hallucination_score = random.uniform(0.7, 1.0) if has_anomaly else random.uniform(0.0, 0.3)
            status = "success" if random.random() > 0.02 else "failed"
            run_id = uuid.uuid4()

            await conn.execute('''
                INSERT INTO inference_runs (
                    id, model_name, input_type, input_text, output_text, 
                    latency_ms, token_count_input, token_count_output, 
                    cost_usd, organization_id, hallucination_score, status, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                ON CONFLICT (id) DO NOTHING
            ''', run_id, model["name"], "text", "Sample input", "Sample output intelligence packet.", 
                latency, tokens_in, tokens_out, cost, org_id, hallucination_score, status, current_time)
            
            # Publish to Redis
            event = {
                "event_type": "metric_update",
                "project_id": str(org_id),
                "run_id": str(run_id),
                "model_name": model["name"],
                "latency_ms": latency,
                "token_count_input": tokens_in,
                "token_count_output": tokens_out,
                "cost_usd": cost,
                "hallucination_score": hallucination_score,
                "status": status,
                "timestamp": current_time.isoformat()
            }
            r.publish(f"metrics:{org_id}", json.dumps(event))

            if i % 100 == 0:
                print(f"Generated {i} runs...")
        
        print("Seeding complete.")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(seed_data())
