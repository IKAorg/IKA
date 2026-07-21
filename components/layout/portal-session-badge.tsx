"use client";

import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { createPortalClient } from "@/lib/supabase/portal-browser";
import type { Locale } from "@/lib/i18n/config";

type PortalSessionBadgeProps = {
  locale: Locale;
};

type CachedPortalPayload = {
  payload?: {
    profile?: {
      display_name?: string | null;
    } | null;
    member?: {
      first_name?: string | null;
      last_name?: string | null;
    } | null;
  } | null;
};

const portalCacheKey = "ika-portal-cache";

const loggedInLabels: Partial<Record<Locale, string>> = {
  en: "Logged in as",
  es: "Conectado como",
  it: "Connesso come",
  fr: "Connecte en tant que",
  ja: "ログイン中",
  zh: "当前登录",
  cs: "Prihlasen jako",
  id: "Masuk sebagai",
  ms: "Log masuk sebagai",
  eu: "Honela konektatuta",
  pt: "Ligado como",
  de: "Angemeldet als",
};

function getCachedDisplayName() {
  if (typeof window === "undefined") {
    return "";
  }

  const raw = window.sessionStorage.getItem(portalCacheKey);
  if (!raw) {
    return "";
  }

  try {
    const cached = JSON.parse(raw) as CachedPortalPayload;
    const directName = cached.payload?.profile?.display_name?.trim();
    if (directName) {
      return directName;
    }

    const firstName = cached.payload?.member?.first_name?.trim() ?? "";
    const lastName = cached.payload?.member?.last_name?.trim() ?? "";
    return `${firstName} ${lastName}`.trim();
  } catch {
    return "";
  }
}

function buildDisplayName(session: Session | null) {
  if (!session?.user) {
    return "";
  }

  const cachedName = getCachedDisplayName();
  if (cachedName) {
    return cachedName;
  }

  const metadata = session.user.user_metadata as
    | { display_name?: string; full_name?: string; name?: string }
    | undefined;

  const metadataName =
    metadata?.display_name?.trim() ||
    metadata?.full_name?.trim() ||
    metadata?.name?.trim() ||
    "";

  if (metadataName) {
    return metadataName;
  }

  return session.user.email?.trim() ?? "";
}

export function PortalSessionBadge({ locale }: PortalSessionBadgeProps) {
  const supabase = useMemo(() => createPortalClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    let active = true;

    async function hydrateSession() {
      const { data } = await supabase.auth.getSession();
      if (!active) {
        return;
      }
      setSession(data.session ?? null);
      setDisplayName(buildDisplayName(data.session ?? null));
    }

    void hydrateSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) {
        return;
      }
      setSession(nextSession ?? null);
      setDisplayName(buildDisplayName(nextSession ?? null));
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  if (!session || !displayName) {
    return null;
  }

  const label = loggedInLabels[locale] ?? loggedInLabels.en ?? "Logged in as";

  return (
    <div className="hidden min-w-0 text-right lg:block">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
        {label}
      </p>
      <p className="max-w-48 truncate text-xs font-semibold text-[var(--foreground)]">
        {displayName}
      </p>
    </div>
  );
}
