import { NextResponse } from "next/server";
import { type Locale, isLocale } from "@/lib/i18n/config";
import {
  getTargetLocales,
  normalizeTranslationError,
  translateStructuredContent,
} from "@/lib/admin/openai-translation";
import { createClient } from "@/lib/supabase/server";

type SecretaryTranslationInput = {
  title: string;
  body: string;
  photoAlt: string;
};

type TranslationResponse = {
  locales: Array<{
    locale: Locale;
    title: string;
    body: string;
    photoAlt: string;
  }>;
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Debes iniciar sesion para traducir el secretario general." },
      { status: 401 },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    sourceLocale?: string;
    source?: SecretaryTranslationInput;
  } | null;

  if (
    !body?.sourceLocale ||
    !isLocale(body.sourceLocale) ||
    !body.source ||
    typeof body.source.title !== "string" ||
    typeof body.source.body !== "string" ||
    typeof body.source.photoAlt !== "string"
  ) {
    return NextResponse.json(
      { error: "Faltan datos validos para traducir el secretario general." },
      { status: 400 },
    );
  }

  const sourceLocale = body.sourceLocale;
  const targetLocales = getTargetLocales(sourceLocale);

  try {
    const translated = await translateSecretary({
      sourceLocale,
      targetLocales,
      source: body.source,
    });

    return NextResponse.json({
      message: `Traduccion generada para ${translated.locales.length} idiomas.`,
      translations: translated.locales,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? normalizeTranslationError(error.message)
        : "No se pudo traducir el secretario general.";

    return NextResponse.json(
      { error: message },
      { status: 502 },
    );
  }
}

async function translateSecretary({
  sourceLocale,
  targetLocales,
  source,
}: {
  sourceLocale: Locale;
  targetLocales: Locale[];
  source: SecretaryTranslationInput;
}): Promise<TranslationResponse> {
  return normalizeTranslation(
    await translateStructuredContent<TranslationResponse>({
      sourceLocale,
      targetLocales,
      expectedShape: "{ locales: [{ locale, title, body, photoAlt }] }",
      source,
    }),
    targetLocales,
  );
}

function normalizeTranslation(
  response: TranslationResponse,
  targetLocales: Locale[],
): TranslationResponse {
  const translatedLocales = (response.locales ?? []).filter((item) =>
    targetLocales.includes(item.locale),
  );

  if (translatedLocales.length !== targetLocales.length) {
    throw new Error("La traduccion no devolvio todos los idiomas esperados.");
  }

  return {
    locales: translatedLocales.map((item) => ({
      locale: item.locale,
      title: item.title ?? "",
      body: item.body ?? "",
      photoAlt: item.photoAlt ?? "",
    })),
  };
}
