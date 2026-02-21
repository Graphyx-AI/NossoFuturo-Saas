import { NextResponse } from "next/server";
import Papa from "papaparse";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });
  }
  const text = await file.text();
  const result = Papa.parse<string[]>(text, { skipEmptyLines: true });
  if (result.errors.length > 0) {
    return NextResponse.json({
      error: result.errors[0]?.message ?? "Erro ao ler CSV",
      rows: [],
    });
  }
  const rows = result.data ?? [];
  return NextResponse.json({ rows });
}
