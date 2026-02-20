import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getWorkspaceById, getWorkspacesForUser } from "@/actions/workspaces";
import {
  getMonthlyInvestments,
  getYearlyInvestments,
  getInvestmentsByDateRange,
} from "@/actions/investments";
import { formatBRL } from "@/lib/utils/currency";

const WORKSPACE_COOKIE = "workspace_id";

function getEndOfMonth(year: number, monthIndex: number): string {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
}

function escapeCsv(s: string): string {
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

const TYPE_LABELS: Record<string, string> = {
  outro: "Outro",
  cdb: "CDB",
  lci: "LCI",
  lca: "LCA",
  tesouro: "Tesouro",
  acao: "Ação",
  fii: "FII",
  crypto: "Cripto",
};

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const workspaceId = cookieStore.get(WORKSPACE_COOKIE)?.value ?? null;
  const workspaces = await getWorkspacesForUser();
  const firstWorkspaceId = workspaces[0]?.id ?? null;
  const preferredWorkspaceId = workspaceId ?? firstWorkspaceId;
  const workspaceFromPreferred = await getWorkspaceById(preferredWorkspaceId);
  const workspace =
    workspaceFromPreferred ??
    (firstWorkspaceId && firstWorkspaceId !== preferredWorkspaceId
      ? await getWorkspaceById(firstWorkspaceId)
      : null);

  if (!workspace) {
    return NextResponse.json({ error: "Workspace não encontrado" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get("year");
  const monthParam = searchParams.get("month");
  const fromMonthParam = searchParams.get("fromMonth");
  const toMonthParam = searchParams.get("toMonth");

  const now = new Date();
  const year = yearParam ? parseInt(yearParam, 10) : now.getFullYear();
  const month = monthParam !== null && monthParam !== undefined ? parseInt(monthParam, 10) : now.getMonth();
  const fromMonth = fromMonthParam !== null && fromMonthParam !== undefined ? parseInt(fromMonthParam, 10) : 0;
  const toMonth = toMonthParam !== null && toMonthParam !== undefined ? parseInt(toMonthParam, 10) : 11;

  let investments: Awaited<ReturnType<typeof getMonthlyInvestments>>;

  if (fromMonthParam != null && toMonthParam != null) {
    const from = Math.min(11, Math.max(0, fromMonth));
    const to = Math.min(11, Math.max(0, toMonth));
    const [f, t] = from <= to ? [from, to] : [to, from];
    const startDate = `${year}-${String(f + 1).padStart(2, "0")}-01`;
    const endDate = getEndOfMonth(year, t);
    investments = await getInvestmentsByDateRange(workspace.id, startDate, endDate);
  } else if (monthParam != null) {
    investments = await getMonthlyInvestments(workspace.id, year, Math.min(11, Math.max(0, month)));
  } else {
    investments = await getYearlyInvestments(workspace.id, year);
  }

  const header = "Data;Nome;Categoria;Valor (R$)";
  const rows = investments.map((i) => {
    const dateFormatted = new Date(i.date + "T12:00:00").toLocaleDateString("pt-BR");
    const category = TYPE_LABELS[i.type as string] ?? i.type;
    const valueFormatted = formatBRL(i.amount);
    return `${dateFormatted};${escapeCsv(i.name)};${escapeCsv(category)};${escapeCsv(valueFormatted)}`;
  });
  const csv = "\uFEFF" + header + "\n" + rows.join("\n");

  const filename =
    monthParam != null
      ? `investimentos_${year}_${String(month + 1).padStart(2, "0")}.csv`
      : fromMonthParam != null && toMonthParam != null
        ? `investimentos_${year}_${String(fromMonth + 1).padStart(2, "0")}-${String(toMonth + 1).padStart(2, "0")}.csv`
        : `investimentos_${year}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
