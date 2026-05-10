"use client";

import { AreaChart as RechartsAreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface AreaChartProps {
  data: any[];
  dataKey: string;
  xAxisKey: string;
  color?: string;
  title?: string;
  height?: number;
}

export default function AreaChart({
  data,
  dataKey,
  xAxisKey,
  color = "#3b82f6",
  title,
  height = 400,
}: AreaChartProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      {title && <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsAreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey={xAxisKey}
            stroke="#9ca3af"
            tick={{ fill: "#9ca3af" }}
          />
          <YAxis stroke="#9ca3af" tick={{ fill: "#9ca3af" }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1f2937",
              border: "1px solid #374151",
              borderRadius: "8px",
            }}
            itemStyle={{ color: "#f3f4f6" }}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            fill={color}
            fillOpacity={0.3}
            strokeWidth={2}
          />
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
}
