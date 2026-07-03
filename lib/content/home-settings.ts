import { createPublicSupabaseClient } from "@/lib/supabase/public-client";

export type HomeMarqueeSettings = {
  mode: "auto" | "manual";
  reportsDurationSeconds: number;
  articlesDurationSeconds: number;
};

export const defaultHomeMarqueeSettings: HomeMarqueeSettings = {
  mode: "auto",
  reportsDurationSeconds: 56,
  articlesDurationSeconds: 38,
};

export async function getHomeMarqueeSettings() {
  const supabase = createPublicSupabaseClient();

  if (!supabase) {
    return defaultHomeMarqueeSettings;
  }

  const { data, error } = await supabase
    .from("system_settings")
    .select("value")
    .eq("key", "home_marquee")
    .single();

  if (error) {
    return defaultHomeMarqueeSettings;
  }

  return normalizeHomeMarqueeSettings(data?.value);
}

export function getMarqueeDuration(
  settings: HomeMarqueeSettings,
  key: "reports" | "articles",
) {
  if (settings.mode === "auto") {
    return undefined;
  }

  const seconds =
    key === "reports"
      ? settings.reportsDurationSeconds
      : settings.articlesDurationSeconds;

  return `${seconds}s`;
}

function normalizeHomeMarqueeSettings(value: unknown): HomeMarqueeSettings {
  if (!value || typeof value !== "object") {
    return defaultHomeMarqueeSettings;
  }

  const candidate = value as Partial<HomeMarqueeSettings>;

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
