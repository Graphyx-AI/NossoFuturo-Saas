export const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export const MONTH_ICON_NAMES = [
  "Sun",
  "Mask",
  "Leaf",
  "CloudSun",
  "Sprout",
  "Flame",
  "Snowflake",
  "Wind",
  "Flower2",
  "Ghost",
  "CloudRain",
  "TreePine",
] as const;

// Ícones alinhados às estações no hemisfério sul (Brasil)
export const MONTH_ICONS = [
  "☀️",  // Jan - verão
  "🎭",  // Fev - Carnaval
  "🍂",  // Mar - outono
  "🌦️", // Abr - outono
  "🍃",  // Mai - outono
  "🔥",  // Jun - inverno / festas juninas
  "❄️",  // Jul - inverno
  "🌬️", // Ago - inverno
  "🌸",  // Set - primavera
  "🎃",  // Out - Halloween
  "🌧️", // Nov - primavera
  "🎄",  // Dez - Natal
];

export function getMonthKey(year: number, monthIndex: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

export function getStartOfMonth(year: number, monthIndex: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-01`;
}

export function getEndOfMonth(year: number, monthIndex: number): string {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
}

/** Retorna a data de hoje no formato YYYY-MM-DD (para inputs type="date"). */
export function getTodayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function formatDateBR(dateStr: string): string {
  if (!dateStr) return "--";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}`;
}

/** Formata data YYYY-MM-DD conforme o locale. */
export function formatDate(dateStr: string, locale: string): string {
  if (!dateStr) return "--";
  const [y, m, d] = dateStr.split("-");
  const month = parseInt(m ?? "0", 10) - 1;
  const date = new Date(parseInt(y ?? "0", 10), month, parseInt(d ?? "0", 10));
  return date.toLocaleDateString(locale, { day: "2-digit", month: "short" });
}
