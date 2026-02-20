import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getWorkspaceById, getWorkspacesForUser } from "@/actions/workspaces";
import { getReceivables } from "@/actions/receivables";
import { formatBRL } from "@/lib/utils/currency";

const WORKSPACE_COOKIE = "workspace_id";

function escapeCsv(s: string): string {
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function formatDateBR(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr + "T12:00:00").toLocaleDateString("pt-BR");
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  overdue: "Atrasado",
  paid: "Pago",
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
  const status = searchParams.get("status") as "pending" | "paid" | "overdue" | undefined;
  const fromDate = searchParams.get("fromDate") ?? undefined;
  const toDate = searchParams.get("toDate") ?? undefined;
  const name = searchParams.get("name") ?? undefined;

  const receivables = await getReceivables(workspace.id, {
    status,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
    debtorName: name,
  });

  const header = "Quem deve;Valor (R$);Vencimento;Status;Telefone;Observações";
  const rows = receivables.map((r) => {
    const valueFormatted = formatBRL(r.amount);
    const dueFormatted = formatDateBR(r.due_date);
    const statusLabel = STATUS_LABELS[r.status] ?? r.status;
    return [
      escapeCsv(r.debtor_name),
      escapeCsv(valueFormatted),
      escapeCsv(dueFormatted),
      escapeCsv(statusLabel),
      escapeCsv(r.phone ?? ""),
      escapeCsv(r.notes ?? ""),
    ].join(";");
  });
  const csv = "\uFEFF" + header + "\n" + rows.join("\n");

  const filename = `cobrancas_${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
