import { useEffect } from "react";
import { useMetricsStore } from "@/lib/store/metricsStore";
import { MetricEvent } from "@/types/metrics";

/**
 * Custom hook to manage the SSE connection for real-time metric streaming.
 * It opens an EventSource connection to the proxy route and updates the global store.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 9.3, 9.4
 */
export function useMetricsStream(projectId: string | undefined) {
  const addEvent = useMetricsStore((state) => state.addEvent);
  const setConnectionStatus = useMetricsStore((state) => state.setConnectionStatus);
  const connectionStatus = useMetricsStore((state) => state.connectionStatus);

  useEffect(() => {
    if (!projectId) return;

    // Requirement 5.1: Open EventSource to the proxy route
    const eventSource = new EventSource(`/api/stream/metrics/${projectId}`);

    // Requirement 5.3: Set status to connected on successful open
    eventSource.onopen = () => {
      setConnectionStatus("connected");
    };

    // Requirement 5.2, 9.4: Handle incoming messages
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as MetricEvent;
        // Requirement 9.3: Dispatch valid event to store
        addEvent(data);
      } catch (error) {
        // Requirement 9.4: Discard malformed JSON
        console.warn("SSE: Malformed JSON received", event.data);
      }
    };

    // Requirement 5.4, 5.5: Handle connection errors
    eventSource.onerror = (event: any) => {
      // Check for specific error codes if sent by the server in the data frame
      // Note: EventSource error events don't typically contain data unless using a polyfill
      // or if we've specifically structured the error stream.
      
      if (event?.data?.includes("REDIS_UNAVAILABLE")) {
        setConnectionStatus("disconnected");
        eventSource.close();
      } else {
        setConnectionStatus("reconnecting");
      }
    };

    // Requirement 5.6: Cleanup on unmount or projectId change
    return () => {
      eventSource.close();
      setConnectionStatus("disconnected");
    };
  }, [projectId, addEvent, setConnectionStatus]);

  return { connectionStatus };
}
