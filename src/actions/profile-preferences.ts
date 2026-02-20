"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const locationConsentSchema = z.object({
  consent: z.boolean(),
  permissionState: z.enum(["unknown", "granted", "denied"]).default("unknown"),
  timezone: z.string().trim().min(1).max(100).nullable().optional(),
  localeHint: z.string().trim().min(1).max(20).nullable().optional(),
  countryHint: z.string().trim().min(1).max(80).nullable().optional(),
  regionHint: z.string().trim().min(1).max(120).nullable().optional(),
  cityHint: z.string().trim().min(1).max(120).nullable().optional(),
});

export type SaveLocationConsentInput = z.infer<typeof locationConsentSchema>;

export async function saveLocationConsent(input: SaveLocationConsentInput) {
  const parsed = locationConsentSchema.parse(input);
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const, error: "Nao autorizado." };
  }

  const payload = {
    user_id: user.id,
    location_consent: parsed.consent,
    location_permission_state: parsed.permissionState,
    timezone: parsed.timezone ?? null,
    locale_hint: parsed.localeHint ?? null,
    country_hint: parsed.countryHint ?? null,
    region_hint: parsed.regionHint ?? null,
    city_hint: parsed.cityHint ?? null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("profile_preferences").upsert(payload, { onConflict: "user_id" });
  if (error) {
    return { ok: false as const, error: error.message };
  }

  return { ok: true as const };
}
