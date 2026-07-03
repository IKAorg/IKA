"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Gauge, Loader2, Save } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/browser";

type MarqueeSettings = {
  mode: "auto" | "manual";
  reportsDurationSeconds: number;
  articlesDurationSeconds: number;
};

const defaultSettings: MarqueeSettings = {
  mode: "auto",
  reportsDurationSeconds: 56,
  articlesDurationSeconds: 38,
};

export function SettingsAdmin() {
  const supabase = useMemo(() => createClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [settings, setSettings] = useState<MarqueeSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "home_marquee")
      .single();

    if (error) {
      setMessage(error.message);
    } else {
      setSettings(normalizeSettings(data?.value));
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
      if (data.session) {
        void loadSettings();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession) {
        void loadSettings();
      }
    });

    return () => subscription.unsubscribe();
  }, [loadSettings, supabase]);

  async function saveSettings() {
    setSaving(true);
    setMessage("");

    const { error } = await supabase.from("system_settings").upsert(
      {
        key: "home_marquee",
        value: settings,
        description: "Public homepage marquee speed settings.",
      },
      { onConflict: "key" },
    );

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Ajustes guardados.");
    }

    setSaving(false);
  }

  if (!session) {
    return (
      <div className="border border-[var(--line)] bg-white p-5 text-sm text-[var(--muted)]">
        Entra primero en el admin para modificar ajustes globales.
      </div>
    );
  }

  return (
    <section className="border border-[var(--line)] bg-white p-5">
      <div className="flex items-center gap-3">
        <Gauge size={22} className="text-[var(--accent)]" />
        <h2 className="text-2xl font-semibold">Velocidad de carruseles</h2>
      </div>

      <div className="mt-5 grid gap-5">
        <label className="grid gap-2 text-sm font-semibold">
          Modo
          <select
            value={settings.mode}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                mode: event.target.value as MarqueeSettings["mode"],
              }))
            }
            className="border border-[var(--line)] px-3 py-2 font-normal"
          >
            <option value="auto">Automatico, como ahora</option>
            <option value="manual">Velocidad elegida por el usuario</option>
          </select>
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <NumberField
            label="Latest reports, segundos por vuelta"
            value={settings.reportsDurationSeconds}
            disabled={settings.mode === "auto"}
            onChange={(value) =>
              setSettings((current) => ({
                ...current,
                reportsDurationSeconds: value,
              }))
            }
          />
          <NumberField
            label="Carrusel inferior, segundos por vuelta"
            value={settings.articlesDurationSeconds}
            disabled={settings.mode === "auto"}
            onChange={(value) =>
              setSettings((current) => ({
                ...current,
                articlesDurationSeconds: value,
              }))
            }
          />
        </div>

        <p className="text-sm leading-6 text-[var(--muted)]">
          Cuanto mayor sea el numero, mas lento se mueve. En automatico se
          mantiene la velocidad actual de la web.
        </p>

        <button
          onClick={saveSettings}
          disabled={loading || saving}
          className="inline-flex items-center justify-center gap-2 bg-[var(--accent)] px-4 py-2 font-semibold text-white disabled:opacity-50"
        >
          {saving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          Guardar ajustes
        </button>

        {message ? (
          <p className="text-sm font-semibold text-[var(--accent)]">
            {message}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function NumberField({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  disabled: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      <input
        value={value}
        disabled={disabled}
        min={18}
        max={180}
        type="number"
        onChange={(event) => onChange(Number(event.target.value))}
        className="border border-[var(--line)] px-3 py-2 font-normal disabled:bg-[var(--paper)] disabled:text-[var(--muted)]"
      />
    </label>
  );
}

function normalizeSettings(value: unknown): MarqueeSettings {
  if (!value || typeof value !== "object") {
    return defaultSettings;
  }

  const candidate = value as Partial<MarqueeSettings>;

  return {
    mode: candidate.mode === "manual" ? "manual" : "auto",
    reportsDurationSeconds: clampSeconds(candidate.reportsDurationSeconds, 56),
    articlesDurationSeconds: clampSeconds(candidate.articlesDurationSeconds, 38),
  };
}

function clampSeconds(value: unknown, fallback: number) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return fallback;
  }

  return Math.min(180, Math.max(18, Math.round(numberValue)));
}
