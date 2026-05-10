"use client";

import { ScatterChart as RechartsScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface ScatterChartProps {
  data: any[];
  xAxisKey: string;
  yAxisKey: string;
  color?: string;
  title?: string;
  height?: number;
}

export default function ScatterChart({
  data,
  xAxisKey,
  yAxisKey,
  color = "#3b82f6",
  title,
  height = 400,
}: ScatterChartProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      {title && <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsScatterChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey={xAxisKey}
            stroke="#9ca3af"
            tick={{ fill: "#9ca3af" }}
          />
          <YAxis
            dataKey={yAxisKey}
            stroke="#9ca3af"
            tick={{ fill: "#9ca3af" }}
          />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            contentStyle={{
              backgroundColor: "#1f2937",
              border: "1px solid #374151",
              borderRadius: "8px",
            }}
            itemStyle={{ color: "#f3f4f6" }}
          />
          <Legend />
          <Scatter fill={color} />
        </RechartsScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
