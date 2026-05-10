/**
 * Shared fast-check arbitraries for MetricEvent and related types.
 * Import these in any frontend property test that needs MetricEvent instances.
 */
import * as fc from "fast-check";
import { MetricEvent } from "@/types/metrics";

/**
 * Generates a valid MetricEvent with all required fields populated.
 */
export function arbitraryMetricEvent(): fc.Arbitrary<MetricEvent> {
  return fc.record<MetricEvent>({
    event_type: fc.constant("metric_update" as const),
    project_id: fc.uuid(),
    run_id: fc.uuid(),
    model_name: fc.string({ minLength: 1, maxLength: 64 }),
    latency_ms: fc.integer({ min: 0, max: 100_000 }),
    token_count_input: fc.integer({ min: 0, max: 100_000 }),
    token_count_output: fc.integer({ min: 0, max: 100_000 }),
    cost_usd: fc.float({ min: 0, max: 100, noNaN: true }),
    hallucination_score: fc.option(fc.float({ min: 0, max: 1, noNaN: true }), {
      nil: null,
    }),
    status: fc.constantFrom("success" as const, "failed" as const, "pending" as const),
    timestamp: fc.date().map((d) => d.toISOString()),
  });
}
