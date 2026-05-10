import { create } from "zustand";
import { MetricEvent, ConnectionStatus } from "@/types/metrics";

// The ten required fields (hallucination_score is optional per spec)
const REQUIRED_FIELDS: (keyof MetricEvent)[] = [
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
];

const MAX_EVENTS = 500;

interface MetricsState {
  // Core state
  events: MetricEvent[];
  connectionStatus: ConnectionStatus;

  // Derived selectors
  latestMetrics: MetricEvent | null;
  averageLatencyMs: number | null;
  totalCostUsd: number;

  selectedEvent: MetricEvent | null;

  // Actions
  addEvent: (event: MetricEvent) => void;
  clearEvents: () => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setSelectedEvent: (event: MetricEvent | null) => void;
}

export const useMetricsStore = create<MetricsState>()((set) => ({
  // Initial state — Requirement 6.7: start with empty list and null selectors
  events: [],
  connectionStatus: "disconnected",
  latestMetrics: null,
  averageLatencyMs: null,
  totalCostUsd: 0,
  selectedEvent: null,

  // Requirement 6.2, 9.5: prepend event, cap at 500, validate required fields
  addEvent: (event: MetricEvent) => {
    // Validate all required fields are present — Requirement 9.5
    const missingFields = REQUIRED_FIELDS.filter(
      (field) => event[field] === undefined || event[field] === null
    );

    if (missingFields.length > 0) {
      console.warn(
        `MetricsStore: discarding event missing required fields: ${missingFields.join(", ")}`,
        event
      );
      return;
    }

    set((state) => {
      // Prepend and cap — Requirements 6.1, 6.2
      const updatedEvents = [event, ...state.events].slice(0, MAX_EVENTS);

      // Recompute derived selectors inline — Requirements 6.3, 6.4, 6.5
      const latestMetrics = updatedEvents[0] ?? null;

      const averageLatencyMs =
        updatedEvents.length > 0
          ? updatedEvents.reduce((sum, e) => sum + e.latency_ms, 0) /
            updatedEvents.length
          : null;

      const totalCostUsd = updatedEvents.reduce(
        (sum, e) => sum + e.cost_usd,
        0
      );

      return {
        events: updatedEvents,
        latestMetrics,
        averageLatencyMs,
        totalCostUsd,
      };
    });
  },

  // Requirement 6.6: reset events to empty, derived selectors back to initial values
  clearEvents: () =>
    set({
      events: [],
      latestMetrics: null,
      averageLatencyMs: null,
      totalCostUsd: 0,
    }),

  // Requirement 5.3, 5.4, 5.5: update connection status
  setConnectionStatus: (status: ConnectionStatus) =>
    set({ connectionStatus: status }),

  setSelectedEvent: (event: MetricEvent | null) =>
    set({ selectedEvent: event }),
}));
