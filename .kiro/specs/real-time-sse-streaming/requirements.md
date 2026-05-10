# Requirements Document

## Introduction

This feature adds real-time Server-Sent Events (SSE) streaming of inference metrics to the CVA Vision + LLM Monitoring Platform. Currently, the dashboard fetches a static snapshot of metrics on page load with no live updates. This feature replaces those static metric cards with live-updating panels that receive pushed metric events from the backend as each Celery inference evaluation completes.

The implementation uses a FastAPI SSE endpoint backed by Redis pub/sub for fan-out, a Next.js App Router proxy route that attaches the JWT from an httpOnly cookie, a `useMetricsStream` React hook, a Zustand metrics store, and a connection status indicator. The existing WebSocket health stream is left untouched.

---

## Glossary

- **SSE_Endpoint**: The FastAPI route `GET /api/v1/stream/metrics/{project_id}` that streams `text/event-stream` responses to connected clients.
- **Redis_PubSub**: The Redis publish/subscribe mechanism used to fan out metric events from Celery workers to all SSE_Endpoint subscribers for a given project.
- **Celery_Worker**: The background task process (`app.workers.tasks`) that runs inference evaluation after each run completes and publishes metric events to Redis_PubSub.
- **Proxy_Route**: The Next.js App Router route handler at `/api/stream/metrics/[projectId]/route.ts` that reads the JWT from the httpOnly cookie and proxies the SSE stream to the frontend client.
- **MetricEvent**: A JSON-serialisable object published to Redis_PubSub and forwarded over SSE, containing a snapshot of aggregated metrics for a project after an inference run completes.
- **useMetricsStream**: The React hook that opens an `EventSource` connection to the Proxy_Route and dispatches received MetricEvents into the MetricsStore.
- **MetricsStore**: The Zustand store (`frontend/lib/store/metricsStore.ts`) that accumulates live MetricEvents and exposes derived state to UI components.
- **ConnectionStatus**: The enumerated state of the SSE connection — `connected`, `reconnecting`, or `disconnected` — surfaced to the user via a status indicator component.
- **LiveMetricsPanel**: The dashboard UI section that replaces the existing static metric cards with live-updating cards driven by MetricsStore.
- **Heartbeat**: A periodic SSE comment (`": heartbeat\n\n"`) sent every 15 seconds by the SSE_Endpoint to prevent idle connection drops by proxies and load balancers.
- **JWT**: The JSON Web Token issued by `/api/v1/auth/login`, currently stored in `localStorage`. For SSE, it must be stored in an httpOnly cookie so the Proxy_Route can attach it server-side.
- **project_id**: The identifier scoping a stream to a specific project's metrics. In the current data model this maps to `organization_id` from the authenticated user's JWT payload.

---

## Requirements

### Requirement 1: JWT Migration to httpOnly Cookie

**User Story:** As a frontend engineer, I want the JWT access token stored in an httpOnly cookie instead of `localStorage`, so that the Next.js Proxy_Route can attach it server-side without exposing it to JavaScript or SSE URL parameters.

#### Acceptance Criteria

1. WHEN a user successfully authenticates via `/api/v1/auth/login`, THE Auth_Service SHALL set an httpOnly, Secure, SameSite=Lax cookie named `access_token` containing the JWT, in addition to returning the token in the response body.
2. WHEN the frontend login flow completes, THE Auth_Store SHALL read the JWT from the response body for in-memory use and SHALL NOT write it to `localStorage`.
3. WHEN the frontend application initialises, THE Auth_Store SHALL derive authentication state from the presence of the `access_token` cookie rather than from `localStorage`.
4. WHEN a user logs out, THE Auth_Store SHALL call the backend logout endpoint, and THE Auth_Service SHALL clear the `access_token` cookie by setting it with `Max-Age=0`.
5. IF the `access_token` cookie is absent or expired when a protected route is accessed, THEN THE Next.js middleware SHALL redirect the user to `/login`.
6. THE ApiClient SHALL continue to attach the JWT as a `Bearer` token in the `Authorization` header for all non-SSE API requests, reading the token from the in-memory Zustand store rather than from `localStorage`.

---

### Requirement 2: Backend SSE Endpoint

**User Story:** As a backend engineer, I want a FastAPI SSE endpoint that streams live metric events scoped to a project, so that connected clients receive pushed updates without polling.

#### Acceptance Criteria

1. THE SSE_Endpoint SHALL accept `GET /api/v1/stream/metrics/{project_id}` requests and respond with `Content-Type: text/event-stream`.
2. THE SSE_Endpoint SHALL set the `X-Accel-Buffering: no` response header to prevent Nginx from buffering the stream.
3. WHEN a client connects to the SSE_Endpoint, THE SSE_Endpoint SHALL subscribe to the Redis_PubSub channel `metrics:{project_id}`.
4. WHEN a MetricEvent is published to the `metrics:{project_id}` Redis_PubSub channel, THE SSE_Endpoint SHALL forward it to all connected clients as an SSE `data:` frame containing the JSON-serialised MetricEvent.
5. WHILE a client is connected, THE SSE_Endpoint SHALL emit a Heartbeat comment every 15 seconds.
6. WHEN a client disconnects, THE SSE_Endpoint SHALL unsubscribe from the Redis_PubSub channel and release all associated resources.
7. THE SSE_Endpoint SHALL validate the JWT supplied in the `Authorization: Bearer` header and SHALL return HTTP 401 if the token is absent, invalid, or expired.
8. IF the Redis_PubSub connection is unavailable when a client connects, THEN THE SSE_Endpoint SHALL return HTTP 503 with a descriptive error message.
9. THE SSE_Endpoint SHALL be registered in `app/main.py` under the existing FastAPI application instance.

---

### Requirement 3: Celery Worker Metric Event Publishing

**User Story:** As a backend engineer, I want the Celery worker to publish a MetricEvent to Redis after each inference evaluation completes, so that connected SSE clients receive live updates.

#### Acceptance Criteria

1. WHEN the `evaluate_run_task` Celery task completes successfully, THE Celery_Worker SHALL publish a MetricEvent to the Redis_PubSub channel `metrics:{project_id}` where `project_id` is the `organization_id` of the run's owning user.
2. THE MetricEvent SHALL contain the following fields: `event_type` (string, value `"metric_update"`), `project_id` (string), `run_id` (string), `model_name` (string), `latency_ms` (integer), `token_count_input` (integer), `token_count_output` (integer), `cost_usd` (float), `hallucination_score` (float or null), `status` (string), and `timestamp` (ISO 8601 UTC string).
3. THE MetricEvent SHALL be serialised as JSON before being published to Redis_PubSub.
4. IF publishing to Redis_PubSub fails, THEN THE Celery_Worker SHALL log the error at WARNING level and SHALL continue without raising an exception, so that the evaluation result is not lost.
5. WHEN the `evaluate_run_task` task fails before completion, THE Celery_Worker SHALL NOT publish a MetricEvent.

---

### Requirement 4: Next.js Proxy Route

**User Story:** As a frontend engineer, I want a Next.js App Router proxy route that attaches the JWT from the httpOnly cookie and proxies the SSE stream, so that the browser's `EventSource` API can consume the stream without exposing the token.

#### Acceptance Criteria

1. THE Proxy_Route SHALL be implemented at `frontend/app/api/stream/metrics/[projectId]/route.ts` as a Next.js App Router route handler exporting a `GET` function.
2. THE Proxy_Route SHALL set `export const runtime = "nodejs"` to ensure Node.js runtime is used instead of the Edge runtime.
3. WHEN a request arrives at the Proxy_Route, THE Proxy_Route SHALL read the JWT from the `access_token` httpOnly cookie.
4. IF the `access_token` cookie is absent, THEN THE Proxy_Route SHALL return HTTP 401 without forwarding the request upstream.
5. THE Proxy_Route SHALL forward the request to the SSE_Endpoint at `{NEXT_PUBLIC_API_URL}/api/v1/stream/metrics/{projectId}` with the JWT attached as `Authorization: Bearer {token}`.
6. THE Proxy_Route SHALL stream the upstream SSE response body directly to the client without buffering, preserving the `Content-Type: text/event-stream` header.
7. THE Proxy_Route SHALL set the `X-Accel-Buffering: no` header on its own response.
8. IF the upstream SSE_Endpoint returns a non-2xx status, THEN THE Proxy_Route SHALL return the same HTTP status code to the client.

---

### Requirement 5: useMetricsStream React Hook

**User Story:** As a frontend engineer, I want a `useMetricsStream` React hook that manages the `EventSource` lifecycle and dispatches received events into the MetricsStore, so that components can subscribe to live metrics without managing connection logic themselves.

#### Acceptance Criteria

1. THE useMetricsStream hook SHALL accept a `projectId` string parameter and SHALL open an `EventSource` connection to `/api/stream/metrics/{projectId}` on mount.
2. WHEN a `message` event is received from the `EventSource`, THE useMetricsStream hook SHALL parse the event data as JSON and SHALL dispatch the resulting MetricEvent to the MetricsStore.
3. WHEN the `EventSource` connection opens successfully, THE useMetricsStream hook SHALL set the ConnectionStatus to `connected`.
4. WHEN the `EventSource` emits an `error` event, THE useMetricsStream hook SHALL set the ConnectionStatus to `reconnecting` and SHALL allow the browser's built-in `EventSource` reconnection to proceed.
5. WHEN the `EventSource` connection is permanently closed (e.g., HTTP 401 or explicit close), THE useMetricsStream hook SHALL set the ConnectionStatus to `disconnected` and SHALL NOT attempt further reconnection.
6. WHEN the component using useMetricsStream unmounts, THE useMetricsStream hook SHALL close the `EventSource` connection and release all event listeners.
7. IF the `projectId` parameter changes, THEN THE useMetricsStream hook SHALL close the existing `EventSource` connection and open a new one for the updated `projectId`.
8. THE useMetricsStream hook SHALL expose the current ConnectionStatus value to the consuming component.

---

### Requirement 6: Zustand MetricsStore

**User Story:** As a frontend engineer, I want a Zustand MetricsStore that accumulates live MetricEvents and exposes derived aggregates, so that dashboard components can reactively display up-to-date metrics without prop drilling.

#### Acceptance Criteria

1. THE MetricsStore SHALL maintain an ordered list of received MetricEvents, with the most recent event first.
2. WHEN a MetricEvent is dispatched to the MetricsStore, THE MetricsStore SHALL prepend the event to the list and SHALL cap the list at 500 events to prevent unbounded memory growth.
3. THE MetricsStore SHALL expose a derived `latestMetrics` selector that returns the most recent MetricEvent, or `null` if no events have been received.
4. THE MetricsStore SHALL expose a derived `averageLatencyMs` selector that computes the mean `latency_ms` across all stored MetricEvents.
5. THE MetricsStore SHALL expose a derived `totalCostUsd` selector that sums `cost_usd` across all stored MetricEvents.
6. THE MetricsStore SHALL expose a `clearEvents` action that empties the event list, to be called on logout or project switch.
7. WHEN the MetricsStore is initialised, THE MetricsStore SHALL start with an empty event list and `null` for all derived selectors.

---

### Requirement 7: Live Metrics Panel

**User Story:** As a platform user, I want the dashboard to display live-updating metric cards driven by the SSE stream, so that I can monitor inference performance in real time without refreshing the page.

#### Acceptance Criteria

1. THE LiveMetricsPanel SHALL replace the existing static metric cards on the dashboard page (`frontend/app/dashboard/page.tsx`) with live-updating equivalents.
2. WHEN the LiveMetricsPanel mounts, THE LiveMetricsPanel SHALL invoke the useMetricsStream hook with the authenticated user's `project_id`.
3. WHEN a new MetricEvent is received, THE LiveMetricsPanel SHALL update the displayed values for Total Requests, Average Latency, Total Cost, and Average Hallucination Score without a full page reload.
4. WHILE no MetricEvents have been received yet, THE LiveMetricsPanel SHALL display the last known values fetched from the existing REST endpoint `/api/v1/metrics/summary` as a fallback.
5. THE LiveMetricsPanel SHALL display the ConnectionStatus indicator adjacent to the panel heading.
6. WHEN the ConnectionStatus is `connected`, THE LiveMetricsPanel SHALL render the indicator with a green colour and the label "Live".
7. WHEN the ConnectionStatus is `reconnecting`, THE LiveMetricsPanel SHALL render the indicator with a yellow colour and the label "Reconnecting…".
8. WHEN the ConnectionStatus is `disconnected`, THE LiveMetricsPanel SHALL render the indicator with a red colour and the label "Disconnected".

---

### Requirement 8: Connection Status Indicator Component

**User Story:** As a platform user, I want a visible connection status indicator on the dashboard, so that I know whether the live metrics stream is active or has been interrupted.

#### Acceptance Criteria

1. THE ConnectionStatusIndicator component SHALL accept a `status` prop of type `"connected" | "reconnecting" | "disconnected"`.
2. THE ConnectionStatusIndicator SHALL render a coloured dot and a text label corresponding to the `status` prop value as defined in Requirement 7 acceptance criteria 6–8.
3. WHEN the `status` prop changes, THE ConnectionStatusIndicator SHALL update its visual state without unmounting and remounting.
4. THE ConnectionStatusIndicator SHALL be accessible, providing an `aria-label` attribute that describes the current connection state in plain text.

---

### Requirement 9: Error Handling and Resilience

**User Story:** As a platform operator, I want the SSE streaming system to handle failures gracefully at every layer, so that transient errors do not crash the dashboard or leave stale connections open.

#### Acceptance Criteria

1. IF the Redis_PubSub subscription is lost while a client is connected, THEN THE SSE_Endpoint SHALL emit an SSE event with `event: error` and `data: {"code": "REDIS_UNAVAILABLE"}` and SHALL close the stream.
2. IF the upstream SSE_Endpoint is unreachable when the Proxy_Route attempts to connect, THEN THE Proxy_Route SHALL return HTTP 502 to the client.
3. WHEN the useMetricsStream hook receives an SSE `error` event with `data` containing `"code": "REDIS_UNAVAILABLE"`, THE useMetricsStream hook SHALL set ConnectionStatus to `disconnected` and SHALL NOT attempt automatic reconnection.
4. IF a MetricEvent received by the useMetricsStream hook cannot be parsed as valid JSON, THEN THE useMetricsStream hook SHALL log a warning to the browser console and SHALL discard the malformed event without updating the MetricsStore.
5. IF a MetricEvent dispatched to the MetricsStore is missing required fields, THEN THE MetricsStore SHALL discard the event and SHALL log a warning.
6. WHEN the SSE_Endpoint handles more than 1000 concurrent connections for a single `project_id`, THE SSE_Endpoint SHALL continue to serve all connections without degradation, relying on Redis_PubSub fan-out rather than in-process broadcasting.
