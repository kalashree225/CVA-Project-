# Implementation Plan: Real-Time SSE Streaming

## Overview

This plan implements live metric streaming for the CVA Vision + LLM Monitoring Platform using Server-Sent Events (SSE). The work is ordered backend-first: data model migration → Celery publisher → FastAPI SSE endpoint → auth cookie changes → Next.js proxy → frontend store/hook → UI components. Each task is scoped to a single implementation session and references the specific requirements and design properties it satisfies.

**Testing libraries:**
- Backend: `pytest` + `hypothesis` (already in `requirements.txt`; add `hypothesis` if missing)
- Frontend: `vitest` + `@testing-library/react` + `fast-check` (install as dev dependencies)

---

## Task Dependency Graph

```
1. Install dependencies
   └─► 2. Add organization_id to InferenceRun (DB migration)
         └─► 3. MetricEvent Pydantic schema + SSE schemas
               └─► 4. SSE service (Redis pub/sub generator)
                     └─► 5. SSE router (FastAPI endpoint)
                           └─► 6. Register SSE router in main.py
                                 └─► 7. Celery worker: publish MetricEvent
                                       └─► 8. Auth router: httpOnly cookie on login/logout
                                             └─► 9. Frontend: MetricEvent TypeScript types
                                                   └─► 10. Frontend: MetricsStore (Zustand)
                                                         └─► 11. Frontend: useMetricsStream hook
                                                               └─► 12. Frontend: Next.js proxy route
                                                                     └─► 13. Frontend: auth store migration
                                                                           └─► 14. Frontend: ApiClient migration
                                                                                 └─► 15. Frontend: ConnectionStatusIndicator
                                                                                       └─► 16. Frontend: LiveMetricsPanel
                                                                                             └─► 17. Dashboard page integration
                                                                                                   └─► 18. Checkpoint
```

---

## Tasks

- [x] 1. Install testing and streaming dependencies
  - Add `hypothesis` to `requirements.txt` (backend property-based testing)
  - Add `vitest`, `@vitejs/plugin-react`, `@testing-library/react`, `@testing-library/user-event`, `jsdom`, and `fast-check` as frontend dev dependencies in `frontend/package.json`
  - Add a `"test": "vitest --run"` script and a `"test:watch": "vitest"` script to `frontend/package.json`
  - Create `frontend/vitest.config.ts` configuring jsdom environment and the React plugin
  - Create `frontend/vitest.setup.ts` with `@testing-library/jest-dom` import
  - _Requirements: Testing Strategy (design.md)_

- [x] 2. Add `organization_id` column to `InferenceRun` and create Alembic migration
  - [x] 2.1 Add `organization_id` column to `InferenceRun` model in `vision_monitor/app/models/run.py`
    - Add `organization_id = Column(UUID(as_uuid=True), nullable=True, index=True)` (nullable for backward compatibility with existing rows)
    - _Requirements: 3.1 — worker needs `organization_id` to publish to the correct Redis channel_
  - [x] 2.2 Generate and write Alembic migration file
    - Create `alembic/versions/20250102_000000_add_organization_id_to_inference_runs.py`
    - Migration adds the `organization_id` column with `nullable=True`
    - _Requirements: 3.1_

- [x] 3. Create MetricEvent Pydantic schema
  - Create `vision_monitor/app/sse/` package with `__init__.py`
  - Create `vision_monitor/app/sse/schemas.py` with the `MetricEvent` Pydantic model containing all eleven required fields: `event_type`, `project_id`, `run_id`, `model_name`, `latency_ms`, `token_count_input`, `token_count_output`, `cost_usd`, `hallucination_score` (Optional[float]), `status`, `timestamp`
  - _Requirements: 3.2, 3.3_

- [x] 4. Implement SSE service (Redis pub/sub async generator)
  - Create `vision_monitor/app/sse/service.py`
  - Implement `async def metric_event_generator(project_id: str, redis_url: str) -> AsyncGenerator[str, None]`
    - Subscribe to channel `metrics:{project_id}` using `aioredis` (already available via `redis[hiredis]`)
    - Yield SSE `data:` frames for each received message
    - Yield heartbeat comment `": heartbeat\n\n"` every 15 seconds using `asyncio.wait_for` or `asyncio.timeout`
    - On Redis connection failure at startup, raise `RedisUnavailableError`
    - On mid-stream Redis failure, yield `event: error\ndata: {"code":"REDIS_UNAVAILABLE"}\n\n` then return
  - _Requirements: 2.3, 2.4, 2.5, 2.6, 2.8, 9.1_

- [x] 5. Implement FastAPI SSE router
  - Create `vision_monitor/app/sse/router.py`
  - Define `router = APIRouter(prefix="/api/v1/stream", tags=["sse"])`
  - Implement `GET /metrics/{project_id}` endpoint:
    - Validate JWT via `Authorization: Bearer` header using existing `AuthService.decode_access_token`; return HTTP 401 if absent/invalid/expired
    - Attempt to connect to Redis; return HTTP 503 with `{"detail": "Stream unavailable: Redis connection failed"}` if unavailable
    - Return `StreamingResponse(metric_event_generator(...), media_type="text/event-stream", headers={"X-Accel-Buffering": "no", "Cache-Control": "no-cache"})`
  - _Requirements: 2.1, 2.2, 2.3, 2.7, 2.8_

- [x] 6. Register SSE router in `app/main.py`
  - Import `from app.sse.router import router as sse_router`
  - Add `app.include_router(sse_router)` after the existing router registrations
  - _Requirements: 2.9_

- [x] 7. Modify Celery worker to publish MetricEvent after successful evaluation
  - Modify `vision_monitor/app/workers/tasks.py`
  - Add `_publish_metric_event(run, eval_result)` helper function:
    - Creates a synchronous `redis.Redis.from_url(settings.REDIS_URL)` client
    - Builds a `MetricEvent`-shaped dict from the `InferenceRun` fields and `eval_result`
    - Calls `r.publish(f"metrics:{run.organization_id}", json.dumps(event))`
    - Wraps the entire publish in `try/except Exception` — logs `WARNING` on failure, never re-raises
  - Call `_publish_metric_event(run, eval_result)` at the end of the success path in `evaluate_run_task`, after `AlertService.check_alerts`
  - Populate `run.organization_id` at run-creation time (update the inference router that creates `InferenceRun` rows to set `organization_id` from the authenticated user's JWT payload)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ]* 7.1 Write property tests for Celery publisher and MetricEvent schema (backend)
  - Create `vision_monitor/tests/test_sse_properties.py`
  - **Property 3: SSE subscribes to correct channel** — use `hypothesis` with `st.uuids()` to generate arbitrary `project_id` values; mock `redis.publish`; assert the channel argument equals `f"metrics:{project_id}"`
    - _Feature: real-time-sse-streaming, Property 3: SSE endpoint subscribes to correct Redis channel_
    - **Validates: Requirements 2.3**
  - **Property 4: MetricEvent round-trip through Redis pub/sub** — use `hypothesis` with a composite strategy generating valid `MetricEvent` dicts; serialise to JSON, deserialise, assert field-for-field equality
    - _Feature: real-time-sse-streaming, Property 4: MetricEvent round-trip through Redis pub/sub_
    - **Validates: Requirements 2.4, 3.3**
  - **Property 5: Invalid JWT returns HTTP 401** — use `hypothesis` with `st.text()` generating arbitrary token strings; assert the SSE endpoint returns 401 for all non-valid tokens
    - _Feature: real-time-sse-streaming, Property 5: Invalid JWT returns HTTP 401_
    - **Validates: Requirements 2.7**
  - **Property 6: Celery publishes to correct channel** — use `hypothesis` with `st.uuids()` for `organization_id`; mock `redis.publish`; assert exactly one publish call to `metrics:{organization_id}`
    - _Feature: real-time-sse-streaming, Property 6: Celery worker publishes to correct channel after successful evaluation_
    - **Validates: Requirements 3.1**
  - **Property 7: Published MetricEvent has all required fields** — use `hypothesis` with composite strategy for `InferenceRun`-like data; assert the published JSON contains all eleven required fields with correct types
    - _Feature: real-time-sse-streaming, Property 7: Published MetricEvent contains all required fields_
    - **Validates: Requirements 3.2**
  - Each test must run a minimum of 100 iterations (`@settings(max_examples=100)`)
  - _Requirements: 2.3, 2.4, 2.7, 3.1, 3.2, 3.3_

- [x] 8. Modify auth router to set and clear httpOnly cookie
  - Modify `vision_monitor/app/routers/auth.py`
  - Update the `POST /login` endpoint signature to accept `response: Response` as a parameter
  - After creating `access_token`, call `response.set_cookie(key="access_token", value=access_token, httponly=True, secure=True, samesite="lax", max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60)`
  - Add `POST /logout` endpoint that calls `response.delete_cookie(key="access_token")` and returns `{"message": "Logged out"}`
  - _Requirements: 1.1, 1.4_

- [x] 9. Create TypeScript MetricEvent types
  - Create `frontend/types/metrics.ts`
  - Export `MetricEvent` interface with all eleven fields matching the Pydantic schema exactly
  - Export `ConnectionStatus` type: `"connected" | "reconnecting" | "disconnected"`
  - _Requirements: 5.2, 6.1_

- [-] 10. Implement MetricsStore (Zustand)
  - Create `frontend/lib/store/metricsStore.ts`
  - Define `MetricsState` interface with `events: MetricEvent[]`, `connectionStatus: ConnectionStatus`, and actions `addEvent`, `clearEvents`, `setConnectionStatus`
  - Implement `addEvent`: prepend new event to `events`, slice to max 500 entries
  - Implement derived selectors as computed values (or `useShallow` selectors):
    - `latestMetrics`: `events[0] ?? null`
    - `averageLatencyMs`: arithmetic mean of all `latency_ms` values, or `null` if empty
    - `totalCostUsd`: sum of all `cost_usd` values (default `0`)
  - Implement `clearEvents`: reset `events` to `[]`
  - Implement `setConnectionStatus`: update `connectionStatus`
  - Validate incoming events in `addEvent`: if any of the eleven required fields is missing, log `console.warn` and return without adding
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 9.5_

- [ ]* 10.1 Write property tests for MetricsStore
  - Create `frontend/lib/store/__tests__/metricsStore.test.ts`
  - **Property 14: Store ordered and capped at 500** — use `fast-check` with `fc.array(arbitraryMetricEvent(), { minLength: 1, maxLength: 600 })`; dispatch all events; assert `events[0]` is the last dispatched event and `events.length <= 500`
    - _Feature: real-time-sse-streaming, Property 14: MetricsStore event list is always ordered most-recent-first and capped at 500_
    - **Validates: Requirements 6.1, 6.2**
  - **Property 15: averageLatencyMs is arithmetic mean** — use `fast-check` with `fc.array(fc.integer({ min: 0, max: 100000 }), { minLength: 1 })`; build events with those latencies; assert `averageLatencyMs === sum / count`
    - _Feature: real-time-sse-streaming, Property 15: averageLatencyMs is the arithmetic mean of stored events_
    - **Validates: Requirements 6.4**
  - **Property 16: totalCostUsd is sum** — use `fast-check` with `fc.array(fc.float({ min: 0, max: 1 }), { minLength: 0 })`; assert `totalCostUsd === events.reduce((a, e) => a + e.cost_usd, 0)`
    - _Feature: real-time-sse-streaming, Property 16: totalCostUsd is the sum of stored events_
    - **Validates: Requirements 6.5**
  - **Property 17: clearEvents resets store** — use `fast-check` with arbitrary non-empty store states; call `clearEvents`; assert `events.length === 0`, `latestMetrics === null`, `averageLatencyMs === null`, `totalCostUsd === 0`
    - _Feature: real-time-sse-streaming, Property 17: clearEvents resets store to empty state_
    - **Validates: Requirements 6.6**
  - **Property 21: Incomplete MetricEvent rejected** — use `fast-check` with `fc.record` generating objects missing one or more of the eleven required fields; call `addEvent`; assert store `events` is unchanged
    - _Feature: real-time-sse-streaming, Property 21: MetricsStore rejects events missing required fields_
    - **Validates: Requirements 9.5**
  - Each test must run a minimum of 100 iterations
  - _Requirements: 6.1, 6.2, 6.4, 6.5, 6.6, 9.5_

- [ ] 11. Implement `useMetricsStream` React hook
  - Create `frontend/lib/hooks/useMetricsStream.ts`
  - Accept `projectId: string` parameter
  - On mount (and on `projectId` change), open `new EventSource("/api/stream/metrics/${projectId}")`
  - On `open` event: call `metricsStore.setConnectionStatus("connected")`
  - On `message` event:
    - Parse `event.data` as JSON inside `try/catch`
    - On parse success: call `metricsStore.addEvent(parsed)`
    - On parse failure: `console.warn("SSE: malformed JSON", event.data)` — do not update store
  - On `error` event:
    - If `event.data` contains `"REDIS_UNAVAILABLE"`: call `setConnectionStatus("disconnected")`, call `eventSource.close()`, do not reconnect
    - Otherwise: call `setConnectionStatus("reconnecting")` and allow browser built-in reconnect
  - On unmount: call `eventSource.close()` and remove all listeners
  - Return `{ connectionStatus }` to the consuming component
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 9.3, 9.4_

- [ ]* 11.1 Write property tests for `useMetricsStream`
  - Create `frontend/lib/hooks/__tests__/useMetricsStream.test.ts`
  - Mock `EventSource` with a controllable fake implementation
  - **Property 10: Opens EventSource at correct URL** — use `fast-check` with `fc.string({ minLength: 1 })`; render hook with arbitrary `projectId`; assert `EventSource` was constructed with `/api/stream/metrics/${projectId}`
    - _Feature: real-time-sse-streaming, Property 10: useMetricsStream opens EventSource at correct URL_
    - **Validates: Requirements 5.1**
  - **Property 11: Valid JSON messages dispatched to store** — use `fast-check` with `arbitraryMetricEvent()`; fire `message` events with serialised events; assert each appears in `metricsStore.events`
    - _Feature: real-time-sse-streaming, Property 11: Valid JSON messages are dispatched to MetricsStore_
    - **Validates: Requirements 5.2**
  - **Property 12: Unmount closes EventSource** — use `fast-check` with arbitrary mount/unmount timing; assert `eventSource.close()` is called exactly once on unmount and no listeners remain
    - _Feature: real-time-sse-streaming, Property 12: Component unmount closes EventSource_
    - **Validates: Requirements 5.6**
  - **Property 13: projectId change refreshes connection** — use `fast-check` with `fc.tuple(fc.string({ minLength: 1 }), fc.string({ minLength: 1 })).filter(([a, b]) => a !== b)`; assert old `EventSource` is closed and new one opens at the new URL
    - _Feature: real-time-sse-streaming, Property 13: projectId change refreshes EventSource connection_
    - **Validates: Requirements 5.7**
  - **Property 20: Malformed JSON discarded** — use `fast-check` with `fc.string()` filtered to exclude valid JSON; fire `message` events; assert store is unchanged and `console.warn` was called
    - _Feature: real-time-sse-streaming, Property 20: Malformed JSON messages are discarded without updating MetricsStore_
    - **Validates: Requirements 9.4**
  - Each test must run a minimum of 100 iterations
  - _Requirements: 5.1, 5.2, 5.6, 5.7, 9.4_

- [-] 12. Implement Next.js proxy route
  - Create `frontend/app/api/stream/metrics/[projectId]/route.ts`
  - Export `export const runtime = "nodejs"` at the top of the file
  - Implement `export async function GET(request: NextRequest, { params }: { params: { projectId: string } })`
    - Read JWT from `request.cookies.get("access_token")?.value`
    - If absent, return `new Response(null, { status: 401 })`
    - Fetch `${process.env.NEXT_PUBLIC_API_URL}/api/v1/stream/metrics/${params.projectId}` with `Authorization: Bearer ${token}` header
    - If upstream returns non-2xx, return `new Response(null, { status: upstreamResponse.status })`
    - Otherwise, return `new Response(upstreamResponse.body, { headers: { "Content-Type": "text/event-stream", "X-Accel-Buffering": "no", "Cache-Control": "no-cache" } })`
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

- [ ]* 12.1 Write property tests for the proxy route
  - Create `frontend/app/api/stream/metrics/[projectId]/__tests__/route.test.ts`
  - Mock `fetch` with a controllable fake
  - **Property 8: Proxy forwards correct Authorization header** — use `fast-check` with `fc.string({ minLength: 1 })`; set cookie to arbitrary JWT; assert upstream `fetch` was called with `Authorization: Bearer ${jwt}`
    - _Feature: real-time-sse-streaming, Property 8: Proxy route forwards correct Authorization header_
    - **Validates: Requirements 4.3, 4.5**
  - **Property 9: Proxy passes through non-2xx status codes** — use `fast-check` with `fc.integer({ min: 400, max: 599 })`; mock upstream to return that status; assert proxy response has the same status
    - _Feature: real-time-sse-streaming, Property 9: Proxy route passes through upstream non-2xx status codes_
    - **Validates: Requirements 4.8**
  - Each test must run a minimum of 100 iterations
  - _Requirements: 4.3, 4.5, 4.8_

- [-] 13. Migrate Auth Store from localStorage to in-memory + cookie
  - Modify `frontend/lib/store/auth.ts`
  - Remove the `persist` middleware wrapper (or narrow `partialize` to exclude `token`)
  - Remove all `localStorage.setItem` / `localStorage.getItem` / `localStorage.removeItem` calls for `access_token`
  - Store `token` in Zustand in-memory state only (not persisted)
  - Update `login` action: store token in Zustand state; do NOT call `authApi.setToken` (which writes to localStorage)
  - Update `logout` action: call the backend `POST /api/v1/auth/logout` endpoint (which clears the httpOnly cookie), then clear in-memory state
  - Update `fetchUser` action: derive `isAuthenticated` from whether `token` is non-null in state; on 401 response, clear state
  - _Requirements: 1.2, 1.3, 1.4_

- [ ]* 13.1 Write property tests for Auth Store
  - Create `frontend/lib/store/__tests__/auth.test.ts`
  - **Property 1: Protected routes redirect when cookie is absent** — use `fast-check` with `fc.string()` generating arbitrary non-public path strings; simulate middleware execution with no `access_token` cookie; assert redirect to `/login`
    - _Feature: real-time-sse-streaming, Property 1: Protected routes redirect when cookie is absent_
    - **Validates: Requirements 1.5_
  - Each test must run a minimum of 100 iterations
  - _Requirements: 1.5_

- [-] 14. Migrate ApiClient from localStorage to Zustand store
  - Modify `frontend/lib/api/client.ts`
  - In the request interceptor, replace `localStorage.getItem("access_token")` with `import { useAuthStore } from "@/lib/store/auth"; const token = useAuthStore.getState().token;`
  - In the 401 response interceptor, remove `localStorage.removeItem("access_token")`; instead call `useAuthStore.getState().logout()` and redirect to `/login`
  - Modify `frontend/lib/api/auth.ts`
  - Remove `setToken`, `getToken`, and `logout` methods that reference `localStorage`
  - Update `logout` to call `POST /api/v1/auth/logout` via `apiClient.post`
  - _Requirements: 1.2, 1.6_

- [ ]* 14.1 Write property tests for ApiClient
  - Create `frontend/lib/api/__tests__/client.test.ts`
  - Mock `axios` interceptors
  - **Property 2: ApiClient attaches Bearer token from in-memory store** — use `fast-check` with `fc.string({ minLength: 1 })`; set arbitrary token in Zustand store; make a request; assert `Authorization` header equals `Bearer ${token}`
    - _Feature: real-time-sse-streaming, Property 2: ApiClient attaches Bearer token from in-memory store_
    - **Validates: Requirements 1.6**
  - Each test must run a minimum of 100 iterations
  - _Requirements: 1.6_

- [ ] 15. Implement `ConnectionStatusIndicator` component
  - Create `frontend/components/metrics/ConnectionStatusIndicator.tsx`
  - Accept `status: ConnectionStatus` prop
  - Render a coloured dot (`<span>`) and a text label:
    - `"connected"` → green dot (`bg-green-500`) + label `"Live"`
    - `"reconnecting"` → yellow dot (`bg-yellow-500`) + label `"Reconnecting…"`
    - `"disconnected"` → red dot (`bg-red-500`) + label `"Disconnected"`
  - Add `aria-label` attribute describing the current state in plain text (e.g., `"Connection status: Live"`)
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 7.6, 7.7, 7.8_

- [ ]* 15.1 Write property tests for `ConnectionStatusIndicator`
  - Create `frontend/components/metrics/__tests__/ConnectionStatusIndicator.test.tsx`
  - **Property 19: Renders correct color and label for any status** — use `fast-check` with `fc.constantFrom("connected", "reconnecting", "disconnected")`; render component; assert correct colour class, label text, and `aria-label` are present for each status value
    - _Feature: real-time-sse-streaming, Property 19: ConnectionStatusIndicator renders correct color and label for any status_
    - **Validates: Requirements 7.5–7.8, 8.2, 8.4**
  - Each test must run a minimum of 100 iterations
  - _Requirements: 7.6, 7.7, 7.8, 8.2, 8.4_

- [ ] 16. Implement `LiveMetricsPanel` component
  - Create `frontend/components/metrics/LiveMetricsPanel.tsx`
  - Accept no required props (reads `organization_id` from `useAuthStore`)
  - On mount, call `useMetricsStream(user.organization_id)` to start the SSE connection
  - While `metricsStore.events` is empty, fetch fallback values from `GET /api/v1/metrics/summary?hours=24` and display them
  - Once events arrive, display live values from `metricsStore`:
    - Total Requests: count of events in store
    - Average Latency: `averageLatencyMs` formatted as duration
    - Total Cost: `totalCostUsd` formatted as currency
    - Average Hallucination Score: mean of `hallucination_score` values (filter nulls)
  - Render `<ConnectionStatusIndicator status={connectionStatus} />` adjacent to the panel heading
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ]* 16.1 Write property tests for `LiveMetricsPanel`
  - Create `frontend/components/metrics/__tests__/LiveMetricsPanel.test.tsx`
  - Mock `useMetricsStream` and `useAuthStore`
  - **Property 18: LiveMetricsPanel invokes hook with authenticated user's project_id** — use `fast-check` with `fc.uuid()`; set arbitrary `organization_id` in mocked auth store; render `LiveMetricsPanel`; assert `useMetricsStream` was called with that `organization_id`
    - _Feature: real-time-sse-streaming, Property 18: LiveMetricsPanel invokes hook with authenticated user's project_id_
    - **Validates: Requirements 7.2**
  - Each test must run a minimum of 100 iterations
  - _Requirements: 7.2_

- [~] 17. Integrate `LiveMetricsPanel` into the dashboard page
  - Modify `frontend/app/dashboard/page.tsx`
  - Import `LiveMetricsPanel` from `@/components/metrics/LiveMetricsPanel`
  - Replace the static `MetricCard` grid (the four cards for Total Requests, Avg Latency, Total Cost, Avg Hallucination) with `<LiveMetricsPanel />`
  - Keep the "Recent Inference Runs" table section unchanged
  - Remove the `metrics` state and the `apiClient.get("/api/v1/metrics/summary?hours=24")` call from the `useEffect` (this is now handled inside `LiveMetricsPanel` as a fallback)
  - _Requirements: 7.1, 7.3, 7.4_

- [~] 18. Final checkpoint — ensure all tests pass
  - Run backend tests: `pytest vision_monitor/tests/ -v`
  - Run frontend tests: `cd frontend && npm run test`
  - Fix any failing tests before proceeding
  - Verify TypeScript compiles without errors: `cd frontend && npm run type-check`
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP; the core streaming feature works without them, but correctness guarantees are reduced.
- Each property test references a specific property from `design.md` via the tag comment `// Feature: real-time-sse-streaming, Property N: ...`.
- The `organization_id` column on `InferenceRun` (Task 2) is a prerequisite for the Celery publisher (Task 7); the migration must be applied before running the worker in any environment.
- The `fast-check` `arbitraryMetricEvent()` helper should be defined once in a shared test utility file (e.g., `frontend/lib/test-utils/arbitraries.ts`) and imported by all frontend property tests.
- The backend `hypothesis` strategies for `MetricEvent` should similarly be defined in `vision_monitor/tests/strategies.py` and imported by all backend property tests.
- The existing WebSocket health stream (`/api/v1/ws/*`) is untouched by this implementation.
- All 21 correctness properties from `design.md` are covered:
  - Properties 1, 2 → Tasks 13.1, 14.1
  - Properties 3, 4, 5, 6, 7 → Task 7.1
  - Properties 8, 9 → Task 12.1
  - Properties 10, 11, 12, 13, 20 → Task 11.1
  - Properties 14, 15, 16, 17, 21 → Task 10.1
  - Properties 18 → Task 16.1
  - Property 19 → Task 15.1
