import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { locales, type Locale, isLocale } from "@/lib/i18n/config";
import type { PublicPageKey } from "@/lib/i18n/public-pages";
import { createClient } from "@/lib/supabase/server";

type SourceTranslationRow = {
  language_code: Locale;
  title: string;
  slug: string;
  summary: string | null;
  seo_title: string | null;
  seo_description: string | null;
};

type SourceBlockRow = {
  id: string;
  language_code: Locale | null;
  block_type: string;
  sort_order: number;
  is_visible: boolean;
  data: {
    title?: string;
    text?: string;
    image?: string;
    alt?: string;
    items?: string[];
    note?: string;
  };
};

type SourcePageRow = {
  id: string;
  page_key: PublicPageKey;
  page_translations: SourceTranslationRow[];
  content_blocks: SourceBlockRow[];
};

type TranslatedLocale = {
  locale: Locale;
  page: {
    title: string;
    summary: string | null;
    seo_title: string | null;
    seo_description: string | null;
  };
  blocks: Array<{
    sort_order: number;
    is_visible: boolean;
    title: string;
    text: string;
    image: string | null;
    alt: string | null;
    items: string[];
    note: string | null;
  }>;
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
      { error: "Debes iniciar sesión para traducir contenido." },
      { status: 401 },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    pageId?: string;
    sourceLocale?: string;
  } | null;

  if (!body?.pageId || !body.sourceLocale || !isLocale(body.sourceLocale)) {
    return NextResponse.json(
      { error: "Faltan pageId o idioma de origen válido." },
      { status: 400 },
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      {
        error:
          "Falta OPENAI_API_KEY en las variables de entorno. Añádela en Vercel para activar la traducción automática.",
      },
      { status: 400 },
    );
  }

  const sourceLocale = body.sourceLocale;
  const targetLocales = locales.filter((locale) => locale !== sourceLocale);

  const { data, error } = await supabase
    .from("pages")
    .select(
      "id,page_key,page_translations(language_code,title,slug,summary,seo_title,seo_description),content_blocks(id,language_code,block_type,sort_order,is_visible,data)",
    )
    .eq("id", body.pageId)
    .single<SourcePageRow>();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "No se pudo cargar la página." },
      { status: 404 },
    );
  }

  const sourcePage = data.page_translations.find(
    (translation) => translation.language_code === sourceLocale,
  );

  if (!sourcePage) {
    return NextResponse.json(
      { error: "El idioma de origen no tiene contenido guardado." },
      { status: 400 },
    );
  }

  const sourceBlocks = data.content_blocks
    .filter(
      (block) =>
        block.language_code === sourceLocale &&
        block.block_type === "text_section",
    )
    .sort((left, right) => left.sort_order - right.sort_order);

  let translated: TranslationResponse;

  try {
    translated = await translatePage({
      sourceLocale,
      targetLocales,
      page: sourcePage,
      blocks: sourceBlocks,
    });
  } catch (translationError) {
    return NextResponse.json(
      {
        error:
          translationError instanceof Error
            ? translationError.message
            : "No se pudo generar la traducción automática.",
      },
      { status: 502 },
    );
  }

  const targetRows = translated.locales.map((item) => ({
    page_id: data.id,
    language_code: item.locale,
    title: item.page.title,
    slug: sourcePage.slug,
    summary: item.page.summary,
    seo_title: item.page.seo_title,
    seo_description: item.page.seo_description,
  }));

  const { error: translationError } = await supabase
    .from("page_translations")
    .upsert(targetRows, { onConflict: "page_id,language_code" });

  if (translationError) {
    return NextResponse.json({ error: translationError.message }, { status: 500 });
  }

  const { error: deleteError } = await supabase
    .from("content_blocks")
    .delete()
    .eq("page_id", data.id)
    .eq("block_type", "text_section")
    .in("language_code", targetLocales);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  const blockRows = translated.locales.flatMap((item) =>
    item.blocks.map((block) => ({
      page_id: data.id,
      language_code: item.locale,
      block_type: "text_section",
      sort_order: block.sort_order,
      is_visible: block.is_visible,
      data: {
        title: block.title,
        text: block.text,
        image: block.image || undefined,
        alt: block.alt || undefined,
        items: block.items,
        note: block.note || undefined,
      },
    })),
  );

  if (blockRows.length > 0) {
    const { error: insertError } = await supabase
      .from("content_blocks")
      .insert(blockRows);

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  for (const locale of locales) {
    revalidatePath(`/${locale}/${data.page_key}`);
  }

  return NextResponse.json({
    message: `Traducción generada para ${targetLocales.length} idiomas.`,
  });
}

async function translatePage({
  sourceLocale,
  targetLocales,
  page,
  blocks,
}: {
  sourceLocale: Locale;
  targetLocales: Locale[];
  page: SourceTranslationRow;
  blocks: SourceBlockRow[];
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
            "You translate martial arts association website CMS content. Preserve names, organization acronyms, dates, places, URLs, image paths, and JSON structure. Return only valid JSON.",
        },
        {
          role: "user",
          content: JSON.stringify({
            sourceLocale,
            targetLocales,
            expectedShape:
              "{ locales: [{ locale, page: { title, summary, seo_title, seo_description }, blocks: [{ sort_order, is_visible, title, text, image, alt, items, note }] }] }",
            page: {
              title: page.title,
              summary: page.summary,
              seo_title: page.seo_title,
              seo_description: page.seo_description,
            },
            blocks: blocks.map((block) => ({
              sort_order: block.sort_order,
              is_visible: block.is_visible,
              title: block.data.title ?? "",
              text: block.data.text ?? "",
              image: block.data.image ?? null,
              alt: block.data.alt ?? null,
              items: block.data.items ?? [],
              note: block.data.note ?? null,
            })),
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
    throw new Error("OpenAI no devolvió contenido traducido.");
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
    throw new Error("La traducción no devolvió todos los idiomas esperados.");
  }

  return {
    locales: translatedLocales.map((item) => ({
      locale: item.locale,
      page: {
        title: item.page.title ?? "",
        summary: item.page.summary ?? null,
        seo_title: item.page.seo_title ?? null,
        seo_description: item.page.seo_description ?? null,
      },
      blocks: item.blocks.map((block) => ({
        sort_order: block.sort_order,
        is_visible: block.is_visible,
        title: block.title ?? "",
        text: block.text ?? "",
        image: block.image ?? null,
        alt: block.alt ?? null,
        items: block.items ?? [],
        note: block.note ?? null,
      })),
    })),
  };
}
