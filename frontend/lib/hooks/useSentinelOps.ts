"use client";

import { useState } from 'react';

export function useSentinelOps() {
  const [loading, setLoading] = useState(false);

  const execute = async (operation: string) => {
    setLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${baseUrl}/api/v1/ops/execute/${operation}`, {
        method: 'POST',
      });
      const data = await response.json();
      
      // Simple alert for feedback
      alert(data.result.message || `Operation ${operation} executed successfully`);
      return data;
    } catch (error) {
      console.error('Operation failed:', error);
      alert('Operation failed. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return { execute, loading };
}
