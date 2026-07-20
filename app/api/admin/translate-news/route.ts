import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { locales, type Locale, isLocale } from "@/lib/i18n/config";
import { createClient } from "@/lib/supabase/server";

type SourceTranslationRow = {
  language_code: Locale;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string | null;
};

type SourceNewsRow = {
  id: string;
  news_translations: SourceTranslationRow[];
};

type TranslatedLocale = {
  locale: Locale;
  title: string;
  excerpt: string | null;
  body: string | null;
};

type TranslationResponse = {
  locales: TranslatedLocale[];
};

const translationModel = process.env.OPENAI_TRANSLATION_MODEL ?? "gpt-4o-mini";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Debes iniciar sesion para traducir noticias." },
      { status: 401 },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    newsId?: string;
    sourceLocale?: string;
  } | null;

  if (!body?.newsId || !body.sourceLocale || !isLocale(body.sourceLocale)) {
    return NextResponse.json(
      { error: "Faltan newsId o idioma de origen valido." },
      { status: 400 },
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      {
        error:
          "Falta OPENAI_API_KEY en las variables de entorno. Anadela en Vercel para activar la traduccion automatica.",
      },
      { status: 400 },
    );
  }

  const sourceLocale = body.sourceLocale;
  const targetLocales = locales.filter((locale) => locale !== sourceLocale);

  const { data, error } = await supabase
    .from("news")
    .select("id,news_translations(language_code,title,slug,excerpt,body)")
    .eq("id", body.newsId)
    .single<SourceNewsRow>();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "No se pudo cargar la noticia." },
      { status: 404 },
    );
  }

  const sourceTranslation = data.news_translations.find(
    (translation) => translation.language_code === sourceLocale,
  );

  if (!sourceTranslation) {
    return NextResponse.json(
      { error: "El idioma de origen no tiene contenido guardado." },
      { status: 400 },
    );
  }

  let translated: TranslationResponse;

  try {
    translated = await translateNews({
      sourceLocale,
      targetLocales,
      translation: sourceTranslation,
    });
  } catch (translationError) {
    return NextResponse.json(
      {
        error:
          translationError instanceof Error
            ? translationError.message
            : "No se pudo generar la traduccion automatica.",
      },
      { status: 502 },
    );
  }

  const rows = translated.locales.map((item) => ({
    news_id: data.id,
    language_code: item.locale,
    title: item.title,
    slug: sourceTranslation.slug,
    excerpt: item.excerpt,
    body: item.body,
  }));

  const { error: upsertError } = await supabase
    .from("news_translations")
    .upsert(rows, { onConflict: "news_id,language_code" });

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  for (const locale of locales) {
    revalidatePath(`/${locale}/news`);
    revalidatePath(`/${locale}/news/archive`);
    revalidatePath(`/${locale}/news/archive/item/${sourceTranslation.slug}`);
  }

  return NextResponse.json({
    message: `Traduccion generada para ${targetLocales.length} idiomas.`,
  });
}

async function translateNews({
  sourceLocale,
  targetLocales,
  translation,
}: {
  sourceLocale: Locale;
  targetLocales: Locale[];
  translation: SourceTranslationRow;
}): Promise<TranslationResponse> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: translationModel,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You translate martial arts association news content. Preserve names, organization acronyms, dates, places, and JSON structure. Return only valid JSON.",
        },
        {
          role: "user",
          content: JSON.stringify({
            sourceLocale,
            targetLocales,
            expectedShape:
              "{ locales: [{ locale, title, excerpt, body }] }",
            news: {
              title: translation.title,
              excerpt: translation.excerpt,
              body: translation.body,
            },
          }),
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI translation failed: ${error}`);
  }

  const result = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = result.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("OpenAI no devolvio contenido traducido.");
  }

  return normalizeTranslation(JSON.parse(content) as TranslationResponse, targetLocales);
}

function normalizeTranslation(
  response: TranslationResponse,
  targetLocales: Locale[],
): TranslationResponse {
  const translatedLocales = response.locales.filter((item) =>
    targetLocales.includes(item.locale),
  );

  if (translatedLocales.length !== targetLocales.length) {
    throw new Error("La traduccion no devolvio todos los idiomas esperados.");
  }

  return {
    locales: translatedLocales.map((item) => ({
      locale: item.locale,
      title: item.title ?? "",
      excerpt: item.excerpt ?? null,
      body: item.body ?? null,
    })),
  };
}
