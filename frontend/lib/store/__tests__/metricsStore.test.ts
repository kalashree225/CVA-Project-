/**
 * Property-based tests for MetricsStore (Zustand).
 *
 * Feature: real-time-sse-streaming
 * Properties covered: 14, 15, 16, 17, 21
 */
import { describe, it, beforeEach, expect, vi } from "vitest";
import * as fc from "fast-check";
import { useMetricsStore } from "../metricsStore";
import { arbitraryMetricEvent } from "@/lib/test-utils/arbitraries";
import { MetricEvent } from "@/types/metrics";

// Reset the store before each test so tests are independent
beforeEach(() => {
  useMetricsStore.getState().clearEvents();
});

// ─── Helper ──────────────────────────────────────────────────────────────────

function dispatchAll(events: MetricEvent[]) {
  const { addEvent } = useMetricsStore.getState();
  for (const e of events) {
    addEvent(e);
  }
}

// ─── Property 14 ─────────────────────────────────────────────────────────────
// Feature: real-time-sse-streaming, Property 14: MetricsStore event list is
// always ordered most-recent-first and capped at 500
// Validates: Requirements 6.1, 6.2

describe("Property 14: Store ordered most-recent-first and capped at 500", () => {
  it("last dispatched event is always at index 0 and length never exceeds 500", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryMetricEvent(), { minLength: 1, maxLength: 600 }),
        (events) => {
          useMetricsStore.getState().clearEvents();
          dispatchAll(events);

          const state = useMetricsStore.getState();

          // Most-recent-first: the last dispatched event should be at index 0
          expect(state.events[0]).toEqual(events[events.length - 1]);

          // Cap at 500
          expect(state.events.length).toBeLessThanOrEqual(500);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 15 ─────────────────────────────────────────────────────────────
// Feature: real-time-sse-streaming, Property 15: averageLatencyMs is the
// arithmetic mean of stored events
// Validates: Requirements 6.4

describe("Property 15: averageLatencyMs is arithmetic mean", () => {
  it("equals sum / count for any non-empty sequence of events", () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 0, max: 100_000 }), { minLength: 1, maxLength: 200 }),
        (latencies) => {
          useMetricsStore.getState().clearEvents();

          // Build events with the given latencies
          const baseEvent = fc.sample(arbitraryMetricEvent(), 1)[0];
          for (const latency_ms of latencies) {
            useMetricsStore.getState().addEvent({ ...baseEvent, latency_ms });
          }

          const { averageLatencyMs, events } = useMetricsStore.getState();

          const expectedMean =
            events.reduce((sum, e) => sum + e.latency_ms, 0) / events.length;

          expect(averageLatencyMs).toBeCloseTo(expectedMean, 10);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("returns null when store is empty", () => {
    useMetricsStore.getState().clearEvents();
    expect(useMetricsStore.getState().averageLatencyMs).toBeNull();
  });
});

// ─── Property 16 ─────────────────────────────────────────────────────────────
// Feature: real-time-sse-streaming, Property 16: totalCostUsd is the sum of
// stored events
// Validates: Requirements 6.5

describe("Property 16: totalCostUsd is sum of cost_usd values", () => {
  it("equals the sum of all cost_usd values for any sequence of events", () => {
    fc.assert(
      fc.property(
        fc.array(fc.float({ min: 0, max: 1, noNaN: true }), {
          minLength: 0,
          maxLength: 200,
        }),
        (costs) => {
          useMetricsStore.getState().clearEvents();

          const baseEvent = fc.sample(arbitraryMetricEvent(), 1)[0];
          for (const cost_usd of costs) {
            useMetricsStore.getState().addEvent({ ...baseEvent, cost_usd });
          }

          const { totalCostUsd, events } = useMetricsStore.getState();
          const expectedTotal = events.reduce((sum, e) => sum + e.cost_usd, 0);

          expect(totalCostUsd).toBeCloseTo(expectedTotal, 10);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("returns 0 when store is empty", () => {
    useMetricsStore.getState().clearEvents();
    expect(useMetricsStore.getState().totalCostUsd).toBe(0);
  });
});

// ─── Property 17 ─────────────────────────────────────────────────────────────
// Feature: real-time-sse-streaming, Property 17: clearEvents resets store to
// empty state
// Validates: Requirements 6.6

describe("Property 17: clearEvents resets store to empty state", () => {
  it("resets events, latestMetrics, averageLatencyMs, and totalCostUsd", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryMetricEvent(), { minLength: 1, maxLength: 100 }),
        (events) => {
          useMetricsStore.getState().clearEvents();
          dispatchAll(events);

          // Confirm store has data before clearing
          expect(useMetricsStore.getState().events.length).toBeGreaterThan(0);

          useMetricsStore.getState().clearEvents();

          const state = useMetricsStore.getState();
          expect(state.events).toHaveLength(0);
          expect(state.latestMetrics).toBeNull();
          expect(state.averageLatencyMs).toBeNull();
          expect(state.totalCostUsd).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 21 ─────────────────────────────────────────────────────────────
// Feature: real-time-sse-streaming, Property 21: MetricsStore rejects events
// missing required fields
// Validates: Requirements 9.5

const REQUIRED_FIELDS = [
  "event_type",
  "project_id",
  "run_id",
  "model_name",
  "latency_ms",
  "token_count_input",
  "token_count_output",
  "cost_usd",
  "status",
  "timestamp",
] as const;

describe("Property 21: Incomplete MetricEvent is rejected", () => {
  it("does not add an event when one or more required fields are missing", () => {
    fc.assert(
      fc.property(
        // Pick a non-empty subset of required fields to remove
        fc
          .array(
            fc.constantFrom(...REQUIRED_FIELDS),
            { minLength: 1, maxLength: REQUIRED_FIELDS.length }
          )
          .map((fields) => [...new Set(fields)]),
        arbitraryMetricEvent(),
        (fieldsToRemove, validEvent) => {
          useMetricsStore.getState().clearEvents();

          // Build an incomplete event by deleting required fields
          const incompleteEvent = { ...validEvent } as Record<string, unknown>;
          for (const field of fieldsToRemove) {
            delete incompleteEvent[field];
          }

          const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

<<<<<<< HEAD
          useMetricsStore.getState().addEvent(incompleteEvent as unknown as MetricEvent);
=======
          useMetricsStore.getState().addEvent(incompleteEvent as MetricEvent);
>>>>>>> 1f9e1f428c60a05a90a56f90b558cb17b6e52531

          expect(useMetricsStore.getState().events).toHaveLength(0);
          expect(warnSpy).toHaveBeenCalled();

          warnSpy.mockRestore();
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Unit tests ──────────────────────────────────────────────────────────────

describe("MetricsStore unit tests", () => {
  it("initialises with empty events and null selectors", () => {
    useMetricsStore.getState().clearEvents();
    const state = useMetricsStore.getState();
    expect(state.events).toHaveLength(0);
    expect(state.latestMetrics).toBeNull();
    expect(state.averageLatencyMs).toBeNull();
    expect(state.totalCostUsd).toBe(0);
  });

  it("latestMetrics returns the most recently added event", () => {
    const [e1, e2] = fc.sample(arbitraryMetricEvent(), 2);
    useMetricsStore.getState().addEvent(e1);
    useMetricsStore.getState().addEvent(e2);
    expect(useMetricsStore.getState().latestMetrics).toEqual(e2);
  });

  it("setConnectionStatus updates connectionStatus", () => {
    useMetricsStore.getState().setConnectionStatus("connected");
    expect(useMetricsStore.getState().connectionStatus).toBe("connected");

    useMetricsStore.getState().setConnectionStatus("reconnecting");
    expect(useMetricsStore.getState().connectionStatus).toBe("reconnecting");

    useMetricsStore.getState().setConnectionStatus("disconnected");
    expect(useMetricsStore.getState().connectionStatus).toBe("disconnected");
  });

  it("accepts an event where hallucination_score is null (optional field)", () => {
    const event = fc.sample(arbitraryMetricEvent(), 1)[0];
    const eventWithNullScore: MetricEvent = { ...event, hallucination_score: null };
    useMetricsStore.getState().addEvent(eventWithNullScore);
    expect(useMetricsStore.getState().events).toHaveLength(1);
  });
});
