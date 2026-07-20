"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Gauge,
  ImagePlus,
  Languages,
  Loader2,
  Save,
  UserRound,
  X,
} from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { adminLocales } from "@/lib/admin/admin-locales";
import { optimizeImageForUpload } from "@/lib/media/optimize-image";
import { getSettingsAdminCopy } from "@/lib/admin/settings-admin-copy";
import type { Locale } from "@/lib/i18n/config";
import { createClient } from "@/lib/supabase/browser";

type MarqueeSettings = {
  mode: "auto" | "manual";
  reportsDurationSeconds: number;
  articlesDurationSeconds: number;
};

type SecretaryTranslation = {
  title: string;
  body: string;
  photoAlt: string;
};

type SecretarySettings = {
  name: string;
  photoUrl: string;
  translations: Partial<Record<Locale, SecretaryTranslation>>;
};

const defaultSettings: MarqueeSettings = {
  mode: "auto",
  reportsDurationSeconds: 56,
  articlesDurationSeconds: 38,
};

const defaultSecretarySettings: SecretarySettings = {
  name: "",
  photoUrl: "",
  translations: {},
};

export function SettingsAdmin({ initialLocale }: { initialLocale: Locale }) {
  const copy = getSettingsAdminCopy(initialLocale);
  const supabase = useMemo(() => createClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [settings, setSettings] = useState<MarqueeSettings>(defaultSettings);
  const [secretary, setSecretary] = useState<SecretarySettings>(
    defaultSecretarySettings,
  );
  const [secretaryLocale, setSecretaryLocale] = useState<Locale>(initialLocale);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [message, setMessage] = useState("");

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("system_settings")
      .select("key,value")
      .in("key", ["home_marquee", "about_secretary_general"]);

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    const rows = (data ?? []) as Array<{ key: string; value: unknown }>;
    const marqueeRow = rows.find((row) => row.key === "home_marquee");
    const secretaryRow = rows.find(
      (row) => row.key === "about_secretary_general",
    );

    setSettings(normalizeSettings(marqueeRow?.value));
    setSecretary(normalizeSecretarySettings(secretaryRow?.value));
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) {
        void loadSettings();
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession) {
        void loadSettings();
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadSettings, supabase]);

  async function saveSettings() {
    setSaving(true);
    setMessage("");

    const payload = [
      {
        key: "home_marquee",
        value: settings,
        description: "Public homepage marquee speed settings.",
      },
      {
        key: "about_secretary_general",
        value: secretary,
        description: "Secretary General content for the public About IKA page.",
      },
    ];

    const { error } = await supabase
      .from("system_settings")
      .upsert(payload, { onConflict: "key" });

    setMessage(error ? error.message : copy.saved);
    setSaving(false);
  }

  async function uploadSecretaryPhoto(file: File) {
    if (!file.type.startsWith("image/")) {
      setMessage(copy.selectImageFile);
      return;
    }

    setUploading(true);
    setMessage("");
    const optimizedFile = await optimizeImageForUpload(file, {
      maxWidth: 1400,
      maxHeight: 1400,
      quality: 0.78,
      maxBytes: 420 * 1024,
      outputType: "image/webp",
      fileNameBase: file.name,
    });

    const extension = optimizedFile.name.split(".").pop()?.toLowerCase() || "webp";
    const baseName = slugify(optimizedFile.name.replace(/\.[^.]+$/, "")) || "secretary";
    const storagePath = `about/secretary-general/${Date.now()}-${baseName}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("public-media")
      .upload(storagePath, optimizedFile, {
        cacheControl: "31536000",
        contentType: optimizedFile.type,
        upsert: true,
      });

    if (uploadError) {
      setMessage(uploadError.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage
      .from("public-media")
      .getPublicUrl(storagePath);

    setSecretary((current) => ({ ...current, photoUrl: data.publicUrl }));
    setUploading(false);
  }

  async function translateSecretaryFromSpanish() {
    const source = secretary.translations.es ?? {
      title: "",
      body: "",
      photoAlt: "",
    };

    if (!source.title.trim() && !source.body.trim() && !source.photoAlt.trim()) {
      setMessage(copy.secretaryTranslationNeedsSpanish);
      return;
    }

    setTranslating(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/translate-secretary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sourceLocale: "es",
          source,
        }),
      });

      const result = (await response.json().catch(() => null)) as
        | {
            error?: string;
            translations?: Array<{
              locale: Locale;
              title: string;
              body: string;
              photoAlt: string;
            }>;
          }
        | null;

      if (!response.ok || !result?.translations) {
        throw new Error(result?.error ?? copy.secretaryTranslationFailed);
      }

      setSecretary((current) => {
        const nextTranslations = { ...current.translations };

        for (const item of result.translations ?? []) {
          nextTranslations[item.locale] = {
            title: item.title,
            body: item.body,
            photoAlt: item.photoAlt,
          };
        }

        return {
          ...current,
          translations: nextTranslations,
        };
      });

      setMessage(copy.secretaryTranslationReady);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : copy.secretaryTranslationFailed,
      );
    } finally {
      setTranslating(false);
    }
  }

  const secretaryTranslation = secretary.translations[secretaryLocale] ?? {
    title: "",
    body: "",
    photoAlt: "",
  };

  if (!session) {
    return (
      <div className="border border-[var(--line)] bg-white p-5 text-sm text-[var(--muted)]">
        {copy.signInFirst}
      </div>
    );
  }

  return (
    <section className="border border-[var(--line)] bg-white p-5">
      <div className="flex items-center gap-3">
        <Gauge size={22} className="text-[var(--accent)]" />
        <h2 className="text-2xl font-semibold">{copy.title}</h2>
      </div>

      <div className="mt-5 grid gap-5">
        <label className="grid gap-2 text-sm font-semibold">
          {copy.mode}
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
            <option value="auto">{copy.autoMode}</option>
            <option value="manual">{copy.manualMode}</option>
          </select>
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <NumberField
            label={copy.latestReportsSeconds}
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
            label={copy.lowerCarouselSeconds}
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

        <p className="text-sm leading-6 text-[var(--muted)]">{copy.help}</p>

        <div className="border border-[var(--line)] bg-[var(--paper)] p-4">
          <div className="flex items-center gap-3">
            <UserRound size={20} className="text-[var(--accent)]" />
            <h3 className="text-xl font-semibold">{copy.secretaryTitle}</h3>
          </div>

          <div className="mt-4 grid gap-4">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={translateSecretaryFromSpanish}
                disabled={translating || saving || uploading}
                className="inline-flex items-center gap-2 bg-[var(--ink-blue)] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {translating ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Languages size={16} />
                )}
                {copy.translateSecretary}
              </button>
              <p className="text-sm leading-6 text-[var(--muted)]">
                {copy.translateSecretaryHelp}
              </p>
            </div>

            <label className="grid gap-2 text-sm font-semibold">
              {copy.secretaryName}
              <input
                value={secretary.name}
                onChange={(event) =>
                  setSecretary((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                className="border border-[var(--line)] px-3 py-2 font-normal"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              {copy.language}
              <select
                value={secretaryLocale}
                onChange={(event) =>
                  setSecretaryLocale(event.target.value as Locale)
                }
                className="border border-[var(--line)] px-3 py-2 font-normal"
              >
                {adminLocales.map((locale) => (
                  <option key={locale.value} value={locale.value}>
                    {locale.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              {copy.secretaryRole}
              <input
                value={secretaryTranslation.title}
                onChange={(event) =>
                  setSecretary((current) => ({
                    ...current,
                    translations: {
                      ...current.translations,
                      [secretaryLocale]: {
                        ...secretaryTranslation,
                        title: event.target.value,
                      },
                    },
                  }))
                }
                className="border border-[var(--line)] px-3 py-2 font-normal"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              {copy.secretaryText}
              <textarea
                rows={5}
                value={secretaryTranslation.body}
                onChange={(event) =>
                  setSecretary((current) => ({
                    ...current,
                    translations: {
                      ...current.translations,
                      [secretaryLocale]: {
                        ...secretaryTranslation,
                        body: event.target.value,
                      },
                    },
                  }))
                }
                className="resize-y border border-[var(--line)] px-3 py-2 font-normal"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              {copy.secretaryPhotoAlt}
              <input
                value={secretaryTranslation.photoAlt}
                onChange={(event) =>
                  setSecretary((current) => ({
                    ...current,
                    translations: {
                      ...current.translations,
                      [secretaryLocale]: {
                        ...secretaryTranslation,
                        photoAlt: event.target.value,
                      },
                    },
                  }))
                }
                className="border border-[var(--line)] px-3 py-2 font-normal"
              />
            </label>

            <div className="grid gap-2 text-sm font-semibold">
              <span>{copy.secretaryPhoto}</span>
              <div className="border border-[var(--line)] bg-white p-3">
                {secretary.photoUrl ? (
                  <div
                    className="mb-3 h-44 border border-[var(--line)] bg-contain bg-center bg-no-repeat"
                    style={{ backgroundImage: `url("${secretary.photoUrl}")` }}
                  />
                ) : (
                  <div className="mb-3 flex h-28 items-center justify-center border border-dashed border-[var(--line)] text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                    {copy.noImage}
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 bg-[var(--ink-blue)] px-3 py-2 text-sm font-semibold text-white">
                    {uploading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <ImagePlus size={16} />
                    )}
                    {secretary.photoUrl ? copy.changeImage : copy.uploadImage}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploading}
                      className="sr-only"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        event.target.value = "";
                        if (file) {
                          void uploadSecretaryPhoto(file);
                        }
                      }}
                    />
                  </label>
                  {secretary.photoUrl ? (
                    <button
                      type="button"
                      onClick={() =>
                        setSecretary((current) => ({
                          ...current,
                          photoUrl: "",
                        }))
                      }
                      className="inline-flex items-center gap-2 border border-[var(--line)] px-3 py-2 text-sm font-semibold"
                    >
                      <X size={16} />
                      {copy.removeImage}
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>

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
          {copy.save}
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

function normalizeSecretarySettings(value: unknown): SecretarySettings {
  if (!value || typeof value !== "object") {
    return defaultSecretarySettings;
  }

  const candidate = value as Partial<SecretarySettings>;

  return {
    name: typeof candidate.name === "string" ? candidate.name : "",
    photoUrl: typeof candidate.photoUrl === "string" ? candidate.photoUrl : "",
    translations:
      candidate.translations && typeof candidate.translations === "object"
        ? candidate.translations
        : {},
  };
}

function clampSeconds(value: unknown, fallback: number) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return fallback;
  }

  return Math.min(180, Math.max(18, Math.round(numberValue)));
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
