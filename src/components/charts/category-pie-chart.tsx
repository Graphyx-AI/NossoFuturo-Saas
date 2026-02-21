"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { formatCurrency } from "@/lib/utils/currency";

const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

export function CategoryPieChart({
  data,
  locale = "pt-BR",
}: {
  data: { name: string; value: number }[];
  locale?: string;
}) {
  const formatted = data.map((d) => ({ ...d, value: d.value / 100 }));
  const formatValue = (v: number) => formatCurrency(Math.round(v * 100), locale);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={formatted}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={90}
          paddingAngle={2}
          dataKey="value"
          nameKey="name"
        >
          {formatted.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(v: number) => formatValue(v)} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
