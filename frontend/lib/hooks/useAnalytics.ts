import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';

export function useAnalytics() {
  const [riskDensity, setRiskDensity] = useState<any[]>([]);
  const [strategyData, setStrategyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      const [risk, strategy] = await Promise.all([
        apiClient.get('/api/v1/analytics/risk-density'),
        apiClient.get('/api/v1/analytics/strategy-optimizer')
      ]);
      setRiskDensity(risk);
      setStrategyData(strategy);
    } catch (error) {
      console.error("Failed to fetch real-time analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  return { riskDensity, strategyData, loading, refresh: fetchAnalytics };
}
