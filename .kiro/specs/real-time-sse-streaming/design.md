# Design Document: Real-Time SSE Streaming

## Overview

This design adds real-time Server-Sent Events (SSE) streaming of inference metrics to the CVA Vision + LLM Monitoring Platform. The current dashboard fetches a static snapshot of metrics on page load. This feature replaces those static metric cards with live-updating panels that receive pushed metric events from the backend as each Celery inference evaluation completes.

The architecture follows a layered fan-out pattern:

1. A Celery worker publishes a `MetricEvent` to Redis pub/sub after each evaluation.
2. A FastAPI SSE endpoint subscribes to Redis and streams events to authenticated clients.
3. A Next.js App Router proxy route reads the JWT from an httpOnly cookie and proxies the stream.
4. A `useMetricsStream` React hook manages the `EventSource` lifecycle.
5. A Zustand `MetricsStore` accumulates events and exposes derived aggregates.
6. A `LiveMetricsPanel` and `ConnectionStatusIndicator` render the live data.

The existing WebSocket health stream (`/api/v1/ws/*`) is left untouched.

---

## Architecture

### High-Level Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│  Celery Worker (evaluate_run_task)                                   │
│  After evaluation completes:                                         │
│    redis.publish("metrics:{org_id}", json.dumps(MetricEvent))        │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ Redis Pub/Sub
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│  FastAPI SSE Endpoint                                                │
│  GET /api/v1/stream/metrics/{project_id}                             │
│  - Validates JWT (Authorization: Bearer)                             │
│  - Subscribes to Redis channel metrics:{project_id}                  │
│  - Streams SSE frames: data: {MetricEvent JSON}\n\n                  │
│  - Emits heartbeat comment every 15 s                                │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ HTTP/1.1 text/event-stream (server → Next.js)
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Next.js Proxy Route (Node.js runtime)                               │
│  GET /api/stream/metrics/[projectId]                                 │
│  - Reads JWT from httpOnly cookie access_token                       │
│  - Attaches Authorization: Bearer header                             │
│  - Streams upstream response body to browser without buffering       │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ HTTP/1.1 text/event-stream (Next.js → browser)
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Browser                                                             │
│  useMetricsStream hook                                               │
│  - new EventSource("/api/stream/metrics/{projectId}")                │
│  - Parses JSON, dispatches to MetricsStore                           │
│  - Tracks ConnectionStatus                                           │
│                                                                      │
│  MetricsStore (Zustand)                                              │
│  - Accumulates events (capped at 500)                                │
│  - Exposes latestMetrics, averageLatencyMs, totalCostUsd             │
│                                                                      │
│  LiveMetricsPanel + ConnectionStatusIndicator                        │
│  - Reads from MetricsStore, renders live cards                       │
└─────────────────────────────────────────────────────────────────────┘
```

### JWT / Auth Flow

```
Browser login
  → POST /api/v1/auth/login
  ← { access_token } in body  +  Set-Cookie: access_token=...; HttpOnly; Secure; SameSite=Lax
  → Auth_Store stores token in-memory (Zustand, NOT localStorage)
  → ApiClient reads token from Zustand for REST calls (Authorization: Bearer)
  → Proxy_Route reads token from httpOnly cookie for SSE proxying
  → Next.js middleware checks cookie for protected route access
```

---

## Components and Interfaces

### Backend Components

| Component | File Path | Responsibility |
|---|---|---|
| SSE Router | `vision_monitor/app/sse/router.py` | FastAPI router with the SSE endpoint |
| SSE Service | `vision_monitor/app/sse/service.py` | Redis pub/sub subscription logic, event generator |
| MetricEvent Schema | `vision_monitor/app/sse/schemas.py` | Pydantic model for MetricEvent |
| Redis Publisher | `vision_monitor/app/workers/tasks.py` (modified) | Publishes MetricEvent after evaluate_run_task |
| Auth Router | `vision_monitor/app/routers/auth.py` (modified) | Sets httpOnly cookie on login/logout |
| App Entry | `vision_monitor/app/main.py` (modified) | Registers SSE router |

### Frontend Components

| Component | File Path | Responsibility |
|---|---|---|
| Proxy Route | `frontend/app/api/stream/metrics/[projectId]/route.ts` | Next.js route handler; reads cookie, proxies SSE |
| MetricsStore | `frontend/lib/store/metricsStore.ts` | Zustand store for MetricEvents |
| useMetricsStream | `frontend/lib/hooks/useMetricsStream.ts` | EventSource lifecycle management |
| LiveMetricsPanel | `frontend/components/metrics/LiveMetricsPanel.tsx` | Live metric cards |
| ConnectionStatusIndicator | `frontend/components/metrics/ConnectionStatusIndicator.tsx` | Status dot + label |
| Auth Store | `frontend/lib/store/auth.ts` (modified) | Remove localStorage, use in-memory + cookie |
| API Client | `frontend/lib/api/client.ts` (modified) | Read token from Zustand store, not localStorage |
| Auth API | `frontend/lib/api/auth.ts` (modified) | Remove localStorage calls |
| Dashboard Page | `frontend/app/dashboard/page.tsx` (modified) | Mount LiveMetricsPanel |

---

## Data Models

### MetricEvent (Backend — Pydantic)

```python
# vision_monitor/app/sse/schemas.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class MetricEvent(BaseModel):
    event_type: str          # always "metric_update"
    project_id: str          # organization_id (UUID string)
    run_id: str              # InferenceRun.id (UUID string)
    model_name: str
    latency_ms: int
    token_count_input: int
    token_count_output: int
    cost_usd: float
    hallucination_score: Optional[float] = None
    status: str              # "success" | "failed" | "pending"
    timestamp: str           # ISO 8601 UTC, e.g. "2024-01-15T10:30:00Z"
```

### MetricEvent (Frontend — TypeScript)

```typescript
// frontend/types/metrics.ts
export interface MetricEvent {
  event_type: "metric_update";
  project_id: string;
  run_id: string;
  model_name: string;
  latency_ms: number;
  token_count_input: number;
  token_count_output: number;
  cost_usd: number;
  hallucination_score: number | null;
  status: "success" | "failed" | "pending";
  timestamp: string;
}

export type ConnectionStatus = "connected" | "reconnecting" | "disconnected";
```

### MetricsStore State (TypeScript)

```typescript
// frontend/lib/store/metricsStore.ts
interface MetricsState {
  events: MetricEvent[];                    // ordered, most recent first, capped at 500
  connectionStatus: ConnectionStatus;
  // Derived selectors
  latestMetrics: MetricEvent | null;
  averageLatencyMs: number | null;
  totalCostUsd: number;
  // Actions
  addEvent: (event: MetricEvent) => void;
  clearEvents: () => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
}
```

### Redis Channel Naming

```
Channel: metrics:{project_id}
Example: metrics:550e8400-e29b-41d4-a716-446655440000

Message format: JSON string of MetricEvent
```

### SSE Frame Format

```
data: {"event_type":"metric_update","project_id":"...","run_id":"...","model_name":"llava-1.5","latency_ms":342,"token_count_input":128,"token_count_output":64,"cost_usd":0.0012,"hallucination_score":0.05,"status":"success","timestamp":"2024-01-15T10:30:00Z"}\n\n

: heartbeat\n\n

event: error\ndata: {"code":"REDIS_UNAVAILABLE"}\n\n
```

---

## Integration Points with Existing Code

### 1. `vision_monitor/app/main.py`

Register the new SSE router alongside existing routers:

```python
from app.sse.router import router as sse_router
# ...
app.include_router(sse_router)
```

The SSE router uses prefix `/api/v1/stream` and tag `sse`.

### 2. `vision_monitor/app/workers/tasks.py`

After `evaluate_run_task` completes successfully, add a Redis publish call. The worker already has access to `settings.REDIS_URL`. A synchronous `redis.Redis` client (from `redis-py`) is used since Celery tasks run in a synchronous context:

```python
import redis as redis_sync
import json

def _publish_metric_event(run: InferenceRun, org_id: str, eval_result: dict):
    try:
        r = redis_sync.from_url(settings.REDIS_URL)
        event = {
            "event_type": "metric_update",
            "project_id": org_id,
            "run_id": str(run.id),
            "model_name": run.model_name,
            "latency_ms": run.latency_ms,
            "token_count_input": run.token_count_input,
            "token_count_output": run.token_count_output,
            "cost_usd": run.cost_usd,
            "hallucination_score": eval_result.get("hallucination_score"),
            "status": run.status.value,
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }
        r.publish(f"metrics:{org_id}", json.dumps(event))
    except Exception as e:
        logger.warning(f"Failed to publish MetricEvent to Redis: {e}")
```

The `organization_id` is obtained by joining the `User` table on `run.user_id` (a foreign key to be added, or via the existing `organization_id` on the user fetched during task execution).

> **Note**: `InferenceRun` does not currently have a `user_id` or `organization_id` column. The task will need to look up the user who created the run. The simplest approach is to add an `organization_id` column to `InferenceRun` (populated at run creation time) so the worker can read it directly without an extra join.

### 3. `vision_monitor/app/routers/auth.py`

Modify the `/login` endpoint to set an httpOnly cookie in addition to returning the token in the response body:

```python
from fastapi import Response

@router.post("/login", response_model=Token)
async def login(response: Response, form_data: ..., db: ...):
    # ... existing auth logic ...
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=True,          # requires HTTPS in production
        samesite="lax",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    return Token(access_token=access_token, token_type="bearer")
```

Add a `/logout` endpoint that clears the cookie:

```python
@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(key="access_token")
    return {"message": "Logged out"}
```

### 4. `frontend/lib/api/client.ts`

Replace the `localStorage.getItem("access_token")` call in the request interceptor with a read from the Zustand auth store. Since the store is a module-level singleton, it can be imported directly:

```typescript
import { useAuthStore } from "@/lib/store/auth";

// In request interceptor:
const token = useAuthStore.getState().token;
if (token) {
  config.headers.Authorization = `Bearer ${token}`;
}
```

Remove the `localStorage.removeItem("access_token")` call from the 401 response interceptor.

### 5. `frontend/lib/store/auth.ts`

- Remove all `localStorage.setItem` / `localStorage.getItem` / `localStorage.removeItem` calls for `access_token`.
- Remove the `persist` middleware (or narrow `partialize` to exclude `token`).
- On init, derive `isAuthenticated` from the presence of the `access_token` cookie (readable via `document.cookie` on the client, or via the middleware on the server).
- Store the token in-memory only (Zustand state, not persisted).

### 6. `frontend/app/dashboard/page.tsx`

Replace the static `MetricCard` grid with `<LiveMetricsPanel />`. The existing REST fetch for initial values becomes the fallback inside `LiveMetricsPanel`.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Protected routes redirect when cookie is absent

*For any* URL path that is not in the public routes list (`/login`, `/register`, `/`), when the `access_token` cookie is absent from the request, the Next.js middleware SHALL redirect the response to `/login`.

**Validates: Requirements 1.5**

---

### Property 2: ApiClient attaches Bearer token from in-memory store

*For any* API request made through `ApiClient`, when the in-memory Zustand auth store contains a non-null token, the outgoing request SHALL include an `Authorization: Bearer {token}` header whose value matches the in-memory token exactly.

**Validates: Requirements 1.6**

---

### Property 3: SSE endpoint subscribes to correct Redis channel

*For any* `project_id` string, a client connecting to `GET /api/v1/stream/metrics/{project_id}` SHALL cause the SSE_Endpoint to subscribe to the Redis pub/sub channel named `metrics:{project_id}`.

**Validates: Requirements 2.3**

---

### Property 4: MetricEvent round-trip through Redis pub/sub

*For any* valid `MetricEvent` object, serialising it to JSON and publishing it to the Redis channel, then receiving and deserialising it on the subscriber side, SHALL produce an object that is field-for-field equivalent to the original.

**Validates: Requirements 2.4, 3.3**

---

### Property 5: Invalid JWT returns HTTP 401

*For any* request to the SSE endpoint where the `Authorization` header is absent, contains a malformed token, or contains an expired token, the SSE_Endpoint SHALL return HTTP 401.

**Validates: Requirements 2.7**

---

### Property 6: Celery worker publishes to correct channel after successful evaluation

*For any* `InferenceRun` with an associated `organization_id`, when `evaluate_run_task` completes successfully, the Celery_Worker SHALL publish exactly one message to the Redis channel `metrics:{organization_id}`.

**Validates: Requirements 3.1**

---

### Property 7: Published MetricEvent contains all required fields

*For any* `InferenceRun` that triggers a successful `evaluate_run_task`, the published `MetricEvent` SHALL contain all eleven required fields (`event_type`, `project_id`, `run_id`, `model_name`, `latency_ms`, `token_count_input`, `token_count_output`, `cost_usd`, `hallucination_score`, `status`, `timestamp`) with the correct types.

**Validates: Requirements 3.2**

---

### Property 8: Proxy route forwards correct Authorization header

*For any* valid JWT value stored in the `access_token` httpOnly cookie, the Proxy_Route SHALL forward the upstream request with an `Authorization: Bearer {jwt}` header whose value matches the cookie value exactly.

**Validates: Requirements 4.3, 4.5**

---

### Property 9: Proxy route passes through upstream non-2xx status codes

*For any* HTTP status code in the range 400–599 returned by the upstream SSE_Endpoint, the Proxy_Route SHALL return that same status code to the browser client.

**Validates: Requirements 4.8**

---

### Property 10: useMetricsStream opens EventSource at correct URL

*For any* `projectId` string, mounting a component that uses `useMetricsStream(projectId)` SHALL open an `EventSource` connection to the URL `/api/stream/metrics/{projectId}`.

**Validates: Requirements 5.1**

---

### Property 11: Valid JSON messages are dispatched to MetricsStore

*For any* string that is valid JSON representing a `MetricEvent`, receiving it as a `message` event on the `EventSource` SHALL result in the parsed `MetricEvent` being added to the `MetricsStore` event list.

**Validates: Requirements 5.2**

---

### Property 12: Component unmount closes EventSource

*For any* component that mounts and then unmounts while using `useMetricsStream`, the `EventSource` connection SHALL be closed and all event listeners SHALL be removed upon unmount.

**Validates: Requirements 5.6**

---

### Property 13: projectId change refreshes EventSource connection

*For any* two distinct `projectId` values A and B, changing the `projectId` prop from A to B SHALL close the `EventSource` for `/api/stream/metrics/A` and open a new `EventSource` for `/api/stream/metrics/B`.

**Validates: Requirements 5.7**

---

### Property 14: MetricsStore event list is always ordered most-recent-first and capped at 500

*For any* sequence of `MetricEvent` objects dispatched to the `MetricsStore`, the internal event list SHALL always have the most recently dispatched event at index 0, and the list length SHALL never exceed 500.

**Validates: Requirements 6.1, 6.2**

---

### Property 15: averageLatencyMs is the arithmetic mean of stored events

*For any* non-empty list of `MetricEvent` objects in the `MetricsStore`, the `averageLatencyMs` selector SHALL equal the arithmetic mean of all `latency_ms` values in the list.

**Validates: Requirements 6.4**

---

### Property 16: totalCostUsd is the sum of stored events

*For any* list of `MetricEvent` objects in the `MetricsStore`, the `totalCostUsd` selector SHALL equal the sum of all `cost_usd` values in the list.

**Validates: Requirements 6.5**

---

### Property 17: clearEvents resets store to empty state

*For any* `MetricsStore` state containing one or more events, calling `clearEvents` SHALL result in an empty event list, `null` for `latestMetrics`, `null` for `averageLatencyMs`, and `0` for `totalCostUsd`.

**Validates: Requirements 6.6**

---

### Property 18: LiveMetricsPanel invokes hook with authenticated user's project_id

*For any* authenticated user with a non-null `organization_id`, mounting `LiveMetricsPanel` SHALL invoke `useMetricsStream` with that user's `organization_id` as the `projectId` argument.

**Validates: Requirements 7.2**

---

### Property 19: ConnectionStatusIndicator renders correct color and label for any status

*For any* value of `ConnectionStatus` (`"connected"`, `"reconnecting"`, `"disconnected"`), the `ConnectionStatusIndicator` component SHALL render the corresponding colour class and label text, and SHALL include an `aria-label` attribute describing the state.

**Validates: Requirements 7.5–7.8, 8.2, 8.4**

---

### Property 20: Malformed JSON messages are discarded without updating MetricsStore

*For any* string that is not valid JSON, receiving it as a `message` event on the `EventSource` SHALL NOT add any entry to the `MetricsStore` event list, and SHALL log a warning to the browser console.

**Validates: Requirements 9.4**

---

### Property 21: MetricsStore rejects events missing required fields

*For any* object dispatched to `MetricsStore.addEvent` that is missing one or more of the eleven required `MetricEvent` fields, the store SHALL not add the object to the event list and SHALL log a warning.

**Validates: Requirements 9.5**

---

## Error Handling

### Backend

| Scenario | Behaviour |
|---|---|
| JWT absent / invalid / expired on SSE connect | Return HTTP 401 immediately, before subscribing to Redis |
| Redis unavailable on SSE connect | Return HTTP 503 with `{"detail": "Stream unavailable: Redis connection failed"}` |
| Redis subscription lost mid-stream | Emit `event: error\ndata: {"code":"REDIS_UNAVAILABLE"}\n\n`, then close the generator |
| Redis publish fails in Celery worker | Log `WARNING` with run_id and error; do not re-raise; evaluation result is preserved in DB |
| Celery task fails before completion | No MetricEvent published (publish call is only reached on success path) |
| Upstream SSE unreachable from Proxy_Route | Return HTTP 502 to browser |
| Cookie absent on Proxy_Route request | Return HTTP 401 without forwarding upstream |

### Frontend

| Scenario | Behaviour |
|---|---|
| EventSource `error` event (transient) | Set `ConnectionStatus = "reconnecting"`; allow browser built-in reconnect |
| SSE `event: error` with `REDIS_UNAVAILABLE` | Set `ConnectionStatus = "disconnected"`; call `eventSource.close()`; do not reconnect |
| HTTP 401 from Proxy_Route | Set `ConnectionStatus = "disconnected"`; do not reconnect; redirect to `/login` |
| Malformed JSON in message data | Log `console.warn`; discard event; MetricsStore unchanged |
| MetricEvent missing required fields | MetricsStore logs warning and discards; UI unchanged |
| Component unmount | `eventSource.close()`; remove all listeners |
| `projectId` change | Close old `EventSource`; open new one |

---

## Testing Strategy

### Property-Based Testing

The project uses **Vitest** (frontend) and **pytest + Hypothesis** (backend) for property-based testing.

**Frontend**: Install `fast-check` for property-based testing:
```
npm install --save-dev fast-check
```

**Backend**: Install `hypothesis` for property-based testing:
```
pip install hypothesis
```

Each property test runs a minimum of **100 iterations**.

Tag format for each test:
```
// Feature: real-time-sse-streaming, Property {N}: {property_text}
```

**Properties covered by property-based tests** (from the Correctness Properties section):

- Property 1: Protected routes redirect (fast-check, arbitrary path strings)
- Property 2: ApiClient Bearer header (fast-check, arbitrary token strings)
- Property 3: SSE subscribes to correct channel (Hypothesis, arbitrary project_id UUIDs)
- Property 4: MetricEvent round-trip through Redis (Hypothesis, arbitrary MetricEvent instances)
- Property 5: Invalid JWT returns 401 (Hypothesis, arbitrary malformed token strings)
- Property 6: Celery publishes to correct channel (Hypothesis, arbitrary InferenceRun data)
- Property 7: Published MetricEvent has all required fields (Hypothesis, arbitrary run data)
- Property 8: Proxy forwards correct Authorization header (fast-check, arbitrary JWT strings)
- Property 9: Proxy passes through non-2xx status codes (fast-check, arbitrary 4xx/5xx codes)
- Property 10: useMetricsStream opens correct URL (fast-check, arbitrary projectId strings)
- Property 11: Valid JSON messages dispatched to store (fast-check, arbitrary MetricEvent objects)
- Property 12: Unmount closes EventSource (fast-check, arbitrary mount/unmount sequences)
- Property 13: projectId change refreshes connection (fast-check, arbitrary projectId pairs)
- Property 14: Store ordered and capped at 500 (fast-check, arbitrary event sequences)
- Property 15: averageLatencyMs is arithmetic mean (fast-check, arbitrary latency arrays)
- Property 16: totalCostUsd is sum (fast-check, arbitrary cost arrays)
- Property 17: clearEvents resets store (fast-check, arbitrary store states)
- Property 18: LiveMetricsPanel uses correct projectId (fast-check, arbitrary user objects)
- Property 19: ConnectionStatusIndicator renders correctly (fast-check, all three status values)
- Property 20: Malformed JSON discarded (fast-check, arbitrary non-JSON strings)
- Property 21: Incomplete MetricEvent rejected (fast-check, arbitrary objects with missing fields)

### Unit Tests

Unit tests cover specific examples and edge cases not addressed by property tests:

- Auth store initialises with `isAuthenticated = false` when cookie is absent
- Auth store sets `isAuthenticated = true` after successful login
- Logout calls backend endpoint and clears in-memory token
- SSE endpoint returns `Content-Type: text/event-stream`
- SSE endpoint sets `X-Accel-Buffering: no`
- Proxy route returns 401 when cookie is absent
- Proxy route returns 502 when upstream is unreachable
- `useMetricsStream` sets `ConnectionStatus = "connected"` on EventSource open
- `useMetricsStream` sets `ConnectionStatus = "reconnecting"` on EventSource error
- `useMetricsStream` sets `ConnectionStatus = "disconnected"` on REDIS_UNAVAILABLE error
- MetricsStore initialises with empty events and null selectors
- LiveMetricsPanel displays REST fallback values when MetricsStore is empty

### Integration Tests

Integration tests verify end-to-end wiring with real Redis and a running FastAPI instance:

- Full SSE stream: Celery task completes → Redis publish → SSE endpoint → browser receives event
- Heartbeat: connect to SSE endpoint, wait 15 s, verify heartbeat comment received
- Concurrent connections: 1000+ clients for same project_id all receive published events
- Cookie auth: login sets httpOnly cookie; logout clears it
