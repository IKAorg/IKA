import { type Locale, locales } from "@/lib/i18n/config";

const translationModel = process.env.OPENAI_TRANSLATION_MODEL ?? "gpt-4o-mini";

export function getTargetLocales(sourceLocale: Locale) {
  return locales.filter((locale) => locale !== sourceLocale);
}

export function ensureOpenAiKey() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "Falta OPENAI_API_KEY en las variables de entorno. Anadela en Vercel para activar la traduccion automatica.",
    );
  }
}

export function normalizeTranslationError(message: string) {
  if (message.includes("invalid_api_key")) {
    return "La clave OPENAI_API_KEY configurada en produccion no es valida. Hay que sustituirla por una clave activa en Vercel para poder traducir automaticamente.";
  }

  if (message.includes("Incorrect API key provided")) {
    return "La clave OPENAI_API_KEY configurada en produccion no es valida. Hay que sustituirla por una clave activa en Vercel para poder traducir automaticamente.";
  }

  return message;
}

export async function translateStructuredContent<TOutput>({
  sourceLocale,
  targetLocales,
  expectedShape,
  source,
}: {
  sourceLocale: Locale;
  targetLocales: Locale[];
  expectedShape: string;
  source: unknown;
}): Promise<TOutput> {
  ensureOpenAiKey();

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
            "You translate public website content for an international martial arts association. Preserve proper names, organization acronyms, and structure. Return only valid JSON.",
        },
        {
          role: "user",
          content: JSON.stringify({
            sourceLocale,
            targetLocales,
            expectedShape,
            source,
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

  return JSON.parse(content) as TOutput;
}
