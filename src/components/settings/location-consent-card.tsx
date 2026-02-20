"use client";

import { useMemo, useState } from "react";
import { saveLocationConsent } from "@/actions/profile-preferences";

export function LocationConsentCard() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  const localeHint = useMemo(() => {
    if (typeof navigator === "undefined") return null;
    return navigator.language || null;
  }, []);

  async function requestLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("error");
      setMessage("Geolocalização indisponível neste navegador.");
      return;
    }

    setLoading(true);
    setStatus("idle");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? null;
        const result = await saveLocationConsent({
          consent: true,
          permissionState: "granted",
          timezone,
          localeHint,
          countryHint: null,
          regionHint: null,
          cityHint: null,
        });

        setLoading(false);
        if (!result.ok) {
          setStatus("error");
          setMessage(result.error ?? "Erro ao salvar preferência.");
          return;
        }

        setStatus("ok");
        setMessage(
          `Localização permitida. Latitude ${position.coords.latitude.toFixed(
            2
          )}, longitude ${position.coords.longitude.toFixed(2)}.`
        );
      },
      async () => {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? null;
        await saveLocationConsent({
          consent: false,
          permissionState: "denied",
          timezone,
          localeHint,
          countryHint: null,
          regionHint: null,
          cityHint: null,
        });
        setLoading(false);
        setStatus("error");
        setMessage("Permissão de localização negada.");
      }
    );
  }

  async function denyLocation() {
    setLoading(true);
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? null;
    const result = await saveLocationConsent({
      consent: false,
      permissionState: "denied",
      timezone,
      localeHint,
      countryHint: null,
      regionHint: null,
      cityHint: null,
    });
    setLoading(false);

    if (!result.ok) {
      setStatus("error");
      setMessage(result.error ?? "Erro ao salvar preferência.");
      return;
    }
    setStatus("ok");
    setMessage("Preferência de localização salva.");
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
      <h2 className="text-xl font-bold text-foreground">Localização</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Permita localização para melhorar contexto regional (idioma, timezone e experiência local).
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={loading}
          onClick={requestLocation}
          className="rounded-xl bg-hero-gradient px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-70"
        >
          {loading ? "Salvando..." : "Permitir localização"}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={denyLocation}
          className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground disabled:opacity-70"
        >
          Não permitir
        </button>
      </div>
      {status !== "idle" && (
        <p className={`mt-3 text-sm ${status === "ok" ? "text-emerald-600" : "text-rose-600"}`}>
          {message}
        </p>
      )}
    </section>
  );
}
