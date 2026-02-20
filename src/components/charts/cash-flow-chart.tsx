"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatCurrency } from "@/lib/utils/currency";

export function CashFlowChart({
  labels,
  incomeData,
  expenseData,
  locale = "pt-BR",
  incomeLabel = "Entradas",
  expenseLabel = "Saídas",
}: {
  labels: string[];
  incomeData: number[];
  expenseData: number[];
  locale?: string;
  incomeLabel?: string;
  expenseLabel?: string;
}) {
  const data = labels.map((label, i) => ({
    name: label,
    [incomeLabel]: incomeData[i] / 100,
    [expenseLabel]: expenseData[i] / 100,
  }));

  const formatValue = (reais: number) => formatCurrency(Math.round(reais * 100), locale);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: "bold" }} />
        <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => formatValue(v)} />
        <Tooltip
          formatter={(value: number) => [formatValue(Number(value))]}
          labelFormatter={(label) => label}
        />
        <Legend />
        <Bar dataKey={incomeLabel} fill="#10b981" radius={[8, 8, 0, 0]} />
        <Bar dataKey={expenseLabel} fill="#f43f5e" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
