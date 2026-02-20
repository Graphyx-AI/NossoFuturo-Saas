"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const schema = z.object({
  workspace_id: z.string().uuid(),
  category_id: z.string().uuid().nullable(),
  type: z.enum(["income", "expense", "transfer"]),
  amount: z.number().positive(),
  description: z.string().min(1).max(200),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().max(500).optional(),
});

export async function createTransaction(formData: z.infer<typeof schema>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autorizado");

  const parsed = schema.parse(formData);
  const amountCents = Math.round(parsed.amount * 100);

  const { error } = await supabase.from("transactions").insert({
    workspace_id: parsed.workspace_id,
    category_id: parsed.category_id,
    type: parsed.type,
    amount: amountCents,
    description: parsed.description,
    date: parsed.date,
    notes: parsed.notes ?? null,
    created_by: user.id,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard/reports");
}

export async function updateTransaction(
  id: string,
  workspaceId: string,
  formData: z.infer<typeof schema>
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autorizado");

  const parsed = schema.parse(formData);
  const amountCents = Math.round(parsed.amount * 100);

  const { error } = await supabase
    .from("transactions")
    .update({
      category_id: parsed.category_id,
      type: parsed.type,
      amount: amountCents,
      description: parsed.description,
      date: parsed.date,
      notes: parsed.notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard/reports");
}

export async function deleteTransaction(id: string, workspaceId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard/reports");
}

export async function getTransactionById(id: string, workspaceId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("id, workspace_id, category_id, type, amount, description, date")
    .eq("id", id)
    .eq("workspace_id", workspaceId)
    .single();

  if (error) return null;
  return data;
}

export async function getMonthlyTransactions(
  workspaceId: string,
  year: number,
  month: number
) {
  const supabase = await createClient();
  const start = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const end = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const { data, error } = await supabase
    .from("transactions")
    .select("*, category:categories(id, name, icon, type)")
    .eq("workspace_id", workspaceId)
    .gte("date", start)
    .lte("date", end)
    .order("date", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}
