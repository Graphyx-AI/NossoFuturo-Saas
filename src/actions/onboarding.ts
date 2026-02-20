"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { cookies } from "next/headers";

const intentSchema = z.enum(["personal", "family", "business", "other"]);
const workspaceNameSchema = z
  .string()
  .min(1, "Nome é obrigatório")
  .max(100, "Nome muito longo");

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "workspace";
}

export async function saveOnboardingIntent(intent: z.infer<typeof intentSchema>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autorizado");

  const parsed = intentSchema.parse(intent);

  const { error } = await supabase
    .from("profiles")
    .update({
      onboarding_intent: parsed,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/onboarding");
}

export async function updateWorkspaceName(workspaceId: string, name: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autorizado");

  const parsed = workspaceNameSchema.parse(name);
  const baseSlug = slugify(parsed);
  const slug = `${baseSlug}-${workspaceId.substring(0, 8)}`;

  const { error } = await supabase
    .from("workspaces")
    .update({ name: parsed, slug })
    .eq("id", workspaceId)
    .eq("owner_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/onboarding");
  revalidatePath("/dashboard");
}

export async function completeOnboarding() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autorizado");

  const { error } = await supabase
    .from("profiles")
    .update({
      onboarding_completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) throw new Error(error.message);

  const cookieStore = await cookies();
  cookieStore.set("nf_onboard", "1", {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: false,
    sameSite: "lax",
  });

  revalidatePath("/onboarding");
  revalidatePath("/dashboard");
}

export async function getProfileOnboardingStatus() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("onboarding_completed_at, onboarding_intent")
    .eq("id", user.id)
    .single();

  return data;
}
