"use client";

import { useRouter } from "next/navigation";
import { MONTHS } from "@/lib/utils/dates";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2, CURRENT_YEAR - 3];

type FilterMode = "year" | "month" | "range";

export function InvestmentFilter({
  mode,
  year,
  month,
  fromMonth,
  toMonth,
}: {
  mode: FilterMode;
  year: number;
  month: number;
  fromMonth: number;
  toMonth: number;
}) {
  const router = useRouter();

  function buildUrl(newMode: FilterMode, newYear: number, newMonth: number, newFrom: number, newTo: number): string {
    const params = new URLSearchParams();
    params.set("year", String(newYear));
    if (newMode === "month") {
      params.set("month", String(newMonth));
    } else if (newMode === "range") {
      params.set("fromMonth", String(newFrom));
      params.set("toMonth", String(newTo));
    }
    return `/dashboard/investments?${params.toString()}`;
  }

  const handleModeChange = (newMode: FilterMode) => {
    const m = newMode === "month" ? month : newMode === "range" ? fromMonth : 0;
    const to = newMode === "range" ? toMonth : 11;
    router.push(buildUrl(newMode, year, m, m, to));
  };

  const handleYearChange = (newYear: number) => {
    router.push(buildUrl(mode, newYear, month, fromMonth, toMonth));
  };

  const handleMonthChange = (newMonth: number) => {
    router.push(buildUrl(mode, year, newMonth, fromMonth, toMonth));
  };

  const handleFromMonthChange = (newFrom: number) => {
    const to = newFrom <= toMonth ? toMonth : newFrom;
    router.push(buildUrl(mode, year, month, newFrom, to));
  };

  const handleToMonthChange = (newTo: number) => {
    const from = fromMonth <= newTo ? fromMonth : newTo;
    router.push(buildUrl(mode, year, month, from, newTo));
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground">Período:</span>
      <select
        value={mode}
        onChange={(e) => handleModeChange(e.target.value as FilterMode)}
        className="px-3 py-2 bg-card border border-border rounded-xl text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
      >
        <option value="year">Por ano</option>
        <option value="month">Por mês</option>
        <option value="range">Entre meses</option>
      </select>

      <select
        value={year}
        onChange={(e) => handleYearChange(Number(e.target.value))}
        className="px-3 py-2 bg-card border border-border rounded-xl text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        aria-label="Ano"
      >
        {YEARS.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>

      {mode === "month" && (
        <select
          value={month}
          onChange={(e) => handleMonthChange(Number(e.target.value))}
          className="px-3 py-2 bg-card border border-border rounded-xl text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          aria-label="Mês"
        >
          {MONTHS.map((name, index) => (
            <option key={name} value={index}>
              {name}
            </option>
          ))}
        </select>
      )}

      {mode === "range" && (
        <>
          <select
            value={fromMonth}
            onChange={(e) => handleFromMonthChange(Number(e.target.value))}
            className="px-3 py-2 bg-card border border-border rounded-xl text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            aria-label="De"
          >
            {MONTHS.map((name, index) => (
              <option key={name} value={index}>
                {name}
              </option>
            ))}
          </select>
          <span className="text-muted-foreground text-sm">até</span>
          <select
            value={toMonth}
            onChange={(e) => handleToMonthChange(Number(e.target.value))}
            className="px-3 py-2 bg-card border border-border rounded-xl text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            aria-label="Até"
          >
            {MONTHS.map((name, index) => (
              <option key={name} value={index}>
                {name}
              </option>
            ))}
          </select>
        </>
      )}
    </div>
  );
}
