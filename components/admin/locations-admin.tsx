"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  Building2,
  Flag,
  ImagePlus,
  Loader2,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/browser";
import { defaultLocale, type Locale } from "@/lib/i18n/config";
import { getPublicPageContent } from "@/lib/i18n/public-pages";

type ContentStatus = "draft" | "published" | "archived";

type MediaRow = {
  id: string;
  storage_path: string;
  alt_text: string | null;
};

type CountryTranslationRow = {
  language_code: Locale;
  name: string;
  slug: string;
  description: string | null;
};

type CountryRow = {
  id: string;
  code: string;
  status: ContentStatus;
  is_public: boolean;
  responsible_person: string | null;
  responsible_email: string | null;
  flag_media_id: string | null;
  main_image_media_id: string | null;
  country_translations: CountryTranslationRow[];
};

type DojoTranslationRow = {
  language_code: Locale;
  name: string;
  slug: string;
  description: string | null;
};

type DojoRow = {
  id: string;
  country_id: string;
  city: string;
  address: string | null;
  responsible_instructor: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  status: ContentStatus;
  is_public: boolean;
  main_image_media_id: string | null;
  dojo_translations: DojoTranslationRow[];
};

type CountryForm = {
  id?: string;
  locale: Locale;
  code: string;
  status: ContentStatus;
  isPublic: boolean;
  name: string;
  slug: string;
  description: string;
  responsiblePerson: string;
  responsibleEmail: string;
  logoUrl: string;
  imageUrl: string;
};

type DojoForm = {
  id?: string;
  locale: Locale;
  countryId: string;
  status: ContentStatus;
  isPublic: boolean;
  name: string;
  slug: string;
  description: string;
  city: string;
  address: string;
  responsibleInstructor: string;
  email: string;
  phone: string;
  website: string;
  imageUrl: string;
};

type UploadImageFn = (file: File, scope: string) => Promise<string | null>;

const locales: Array<{ key: Locale; label: string }> = [
  { key: "en", label: "English" },
  { key: "es", label: "Español" },
  { key: "it", label: "Italiano" },
  { key: "fr", label: "Français" },
  { key: "ja", label: "日本語" },
  { key: "zh", label: "中文" },
  { key: "cs", label: "Čeština" },
];

function createEmptyCountryForm(locale: Locale): CountryForm {
  return {
    locale,
    code: "",
    status: "published",
    isPublic: true,
    name: "",
    slug: "",
    description: "",
    responsiblePerson: "",
    responsibleEmail: "",
    logoUrl: "",
    imageUrl: "",
  };
}

function createEmptyDojoForm(locale: Locale): DojoForm {
  return {
    locale,
    countryId: "",
    status: "published",
    isPublic: true,
    name: "",
    slug: "",
    description: "",
    city: "",
    address: "",
    responsibleInstructor: "",
    email: "",
    phone: "",
    website: "",
    imageUrl: "",
  };
}

const legacyCountrySeeds = [
  { code: "CR", index: 0 },
  { code: "CZ", index: 1 },
  { code: "ID-MY", index: 2 },
  { code: "IE", index: 3 },
  { code: "IT", index: 4 },
  { code: "HK", index: 5 },
  { code: "JP", index: 6 },
  { code: "ES", index: 7 },
  { code: "CH", index: 8 },
  { code: "GB", index: 9 },
];

export function LocationsAdmin({
  initialLocale = defaultLocale,
}: {
  initialLocale?: Locale;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [countries, setCountries] = useState<CountryRow[]>([]);
  const [dojos, setDojos] = useState<DojoRow[]>([]);
  const [mediaById, setMediaById] = useState<Map<string, MediaRow>>(new Map());
  const [countryForm, setCountryForm] = useState<CountryForm>(() =>
    createEmptyCountryForm(initialLocale),
  );
  const [dojoForm, setDojoForm] = useState<DojoForm>(() =>
    createEmptyDojoForm(initialLocale),
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const loadMedia = useCallback(
    async (nextCountries: CountryRow[], nextDojos: DojoRow[]) => {
      const ids = [
        ...nextCountries.flatMap((country) => [
          country.flag_media_id,
          country.main_image_media_id,
        ]),
        ...nextDojos.map((dojo) => dojo.main_image_media_id),
      ].filter(Boolean) as string[];

      if (ids.length === 0) {
        setMediaById(new Map());
        return;
      }

      const { data } = await supabase
        .from("media_library")
        .select("id,storage_path,alt_text")
        .in("id", Array.from(new Set(ids)));

      setMediaById(
        new Map(((data ?? []) as MediaRow[]).map((media) => [media.id, media])),
      );
    },
    [supabase],
  );

  const loadLocations = useCallback(async () => {
    setLoading(true);
    const [countriesResult, dojosResult] = await Promise.all([
      supabase
        .from("countries")
        .select(
          "id,code,status,is_public,responsible_person,responsible_email,flag_media_id,main_image_media_id,country_translations(language_code,name,slug,description)",
        )
        .order("code", { ascending: true }),
      supabase
        .from("dojos")
        .select(
          "id,country_id,city,address,responsible_instructor,email,phone,website,status,is_public,main_image_media_id,dojo_translations(language_code,name,slug,description)",
        )
        .order("city", { ascending: true }),
    ]);

    if (countriesResult.error || dojosResult.error) {
      setMessage(
        countriesResult.error?.message ??
          dojosResult.error?.message ??
          "No se pudieron cargar países y dojos.",
      );
      setCountries([]);
      setDojos([]);
      setLoading(false);
      return;
    }

    const nextCountries = (countriesResult.data ?? []) as CountryRow[];
    const nextDojos = (dojosResult.data ?? []) as DojoRow[];
    setCountries(nextCountries);
    setDojos(nextDojos);
    await loadMedia(nextCountries, nextDojos);
    setLoading(false);
  }, [loadMedia, supabase]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) {
        void loadLocations();
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession) {
        void loadLocations();
      } else {
        setCountries([]);
        setDojos([]);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadLocations, supabase]);

  function editCountry(country: CountryRow) {
    setCountryForm(hydrateCountryForm(country, countryForm.locale, mediaById));
  }

  function editDojo(dojo: DojoRow) {
    setDojoForm(hydrateDojoForm(dojo, dojoForm.locale, mediaById));
  }

  function changeCountryFormLocale(locale: Locale) {
    setCountryForm((current) => {
      const country = current.id
        ? countries.find((item) => item.id === current.id)
        : undefined;

      return country
        ? hydrateCountryForm(country, locale, mediaById)
        : { ...current, locale };
    });
  }

  function changeDojoFormLocale(locale: Locale) {
    setDojoForm((current) => {
      const dojo = current.id
        ? dojos.find((item) => item.id === current.id)
        : undefined;

      return dojo ? hydrateDojoForm(dojo, locale, mediaById) : { ...current, locale };
    });
  }

  async function saveCountry() {
    setSaving(true);
    setMessage("");

    const logoMediaId = await saveMediaReference(
      countryForm.logoUrl,
      `${countryForm.name} logo`,
    );
    const payload = {
      code: countryForm.code.toUpperCase(),
      status: countryForm.status,
      is_public: countryForm.isPublic,
      responsible_person: countryForm.responsiblePerson || null,
      responsible_email: countryForm.responsibleEmail || null,
      flag_media_id: logoMediaId,
      main_image_media_id: null,
    };

    const countryResult = countryForm.id
      ? await supabase
          .from("countries")
          .update(payload)
          .eq("id", countryForm.id)
          .select("id")
          .single()
      : await supabase.from("countries").insert(payload).select("id").single();

    if (countryResult.error || !countryResult.data) {
      setMessage(countryResult.error?.message ?? "No se pudo guardar el país.");
      setSaving(false);
      return;
    }

    const countryId = countryResult.data.id as string;
    const { error } = await supabase.from("country_translations").upsert(
      {
        country_id: countryId,
        language_code: countryForm.locale,
        name: countryForm.name,
        slug: countryForm.slug || slugify(countryForm.name),
        description: countryForm.description || null,
      },
      { onConflict: "country_id,language_code" },
    );

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    setCountryForm(createEmptyCountryForm(countryForm.locale));
    setMessage("País guardado.");
    await loadLocations();
    setSaving(false);
  }

  async function saveDojo() {
    setSaving(true);
    setMessage("");

    const imageMediaId = await saveMediaReference(dojoForm.imageUrl, dojoForm.name);
    const payload = {
      country_id: dojoForm.countryId,
      city: dojoForm.city,
      address: dojoForm.address || null,
      responsible_instructor: dojoForm.responsibleInstructor || null,
      email: dojoForm.email || null,
      phone: dojoForm.phone || null,
      website: dojoForm.website || null,
      status: dojoForm.status,
      is_public: dojoForm.isPublic,
      main_image_media_id: imageMediaId,
    };

    const dojoResult = dojoForm.id
      ? await supabase
          .from("dojos")
          .update(payload)
          .eq("id", dojoForm.id)
          .select("id")
          .single()
      : await supabase.from("dojos").insert(payload).select("id").single();

    if (dojoResult.error || !dojoResult.data) {
      setMessage(dojoResult.error?.message ?? "No se pudo guardar el dojo.");
      setSaving(false);
      return;
    }

    const dojoId = dojoResult.data.id as string;
    const dojoSlug = await getUniqueDojoSlug(
      dojoForm.slug || slugify(dojoForm.name),
      dojoForm.locale,
      dojoId,
      dojoForm.city,
    );
    const { error } = await supabase.from("dojo_translations").upsert(
      {
        dojo_id: dojoId,
        language_code: dojoForm.locale,
        name: dojoForm.name,
        slug: dojoSlug,
        description: dojoForm.description || null,
      },
      { onConflict: "dojo_id,language_code" },
    );

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    setDojoForm(createEmptyDojoForm(dojoForm.locale));
    setMessage("Dojo guardado.");
    await loadLocations();
    setSaving(false);
  }

  async function importExistingCountries() {
    setSaving(true);
    setMessage("");

    let importedCount = 0;
    let skippedCount = 0;

    const { data: latestCountries, error: latestCountriesError } =
      await supabase
        .from("countries")
        .select("id,code")
        .order("code", { ascending: true });

    if (latestCountriesError) {
      setMessage(latestCountriesError.message);
      setSaving(false);
      return;
    }

    const countryIdByCode = new Map(
      ((latestCountries ?? []) as Array<{ id: string; code: string }>).map(
        (country) => [country.code, country.id],
      ),
    );

    for (const seed of legacyCountrySeeds) {
      const spanishName =
        getPublicPageContent("es", "countries").countries?.[seed.index] ??
        seed.code;
      let countryId = countryIdByCode.get(seed.code);

      if (!countryId) {
        const { data: existingTranslation } = await supabase
          .from("country_translations")
          .select("country_id")
          .eq("language_code", "es")
          .eq("slug", slugify(spanishName))
          .maybeSingle<{ country_id: string }>();

        countryId = existingTranslation?.country_id;
      }

      if (countryId) {
        const { error } = await supabase
          .from("countries")
          .update({
            code: seed.code,
            status: "published",
            is_public: true,
          })
          .eq("id", countryId);

        if (error) {
          setMessage(error.message);
          setSaving(false);
          return;
        }
      } else {
        const countryResult = await supabase
          .from("countries")
          .insert({
            code: seed.code,
            status: "published",
            is_public: true,
          })
          .select("id")
          .single();

        if (countryResult.error || !countryResult.data) {
          setMessage(
            countryResult.error?.message ??
              `No se pudo importar ${spanishName}.`,
          );
          setSaving(false);
          return;
        }

        countryId = countryResult.data.id as string;
        importedCount += 1;
      }

      for (const locale of locales) {
        const name =
          getPublicPageContent(locale.key, "countries").countries?.[
            seed.index
          ] ?? spanishName;
        const slug = slugify(name);

        const { data: existingSlug } = await supabase
          .from("country_translations")
          .select("country_id")
          .eq("language_code", locale.key)
          .eq("slug", slug)
          .maybeSingle<{ country_id: string }>();

        if (existingSlug && existingSlug.country_id !== countryId) {
          skippedCount += 1;
          continue;
        }

        const { error } = await supabase.from("country_translations").upsert(
          {
            country_id: countryId,
            language_code: locale.key,
            name,
            slug,
            description: null,
          },
          { onConflict: "country_id,language_code" },
        );

        if (error) {
          setMessage(error.message);
          setSaving(false);
          return;
        }
      }
    }

    setMessage(
      skippedCount > 0
        ? `Países importados/actualizados. ${skippedCount} traducciones ya existían con el mismo slug y se han conservado.`
        : importedCount > 0
          ? "Países existentes importados al CMS."
          : "Los países existentes ya están importados y actualizados.",
    );
    await loadLocations();
    setSaving(false);
  }

  async function deleteCountry(id: string) {
    const { error } = await supabase.from("countries").delete().eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("País eliminado.");
    await loadLocations();
  }

  async function deleteDojo(id: string) {
    const { error } = await supabase.from("dojos").delete().eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Dojo eliminado.");
    await loadLocations();
  }

  async function uploadPublicImage(file: File, scope: string) {
    if (!file.type.startsWith("image/")) {
      setMessage("Selecciona un archivo de imagen.");
      return null;
    }

    setUploadingField(scope);
    setMessage("");

    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeScope = slugify(scope) || "image";
    const safeName =
      slugify(file.name.replace(/\.[^.]+$/, "")) || `imagen-${Date.now()}`;
    const storagePath = `locations/${safeScope}/${Date.now()}-${safeName}.${extension}`;

    const { error } = await supabase.storage
      .from("public-media")
      .upload(storagePath, file, {
        cacheControl: "31536000",
        contentType: file.type,
        upsert: true,
      });

    setUploadingField(null);

    if (error) {
      setMessage(error.message);
      return null;
    }

    const { data } = supabase.storage
      .from("public-media")
      .getPublicUrl(storagePath);

    return data.publicUrl;
  }

  async function saveMediaReference(url: string, title: string) {
    if (!url) {
      return null;
    }

    const { data, error } = await supabase
      .from("media_library")
      .upsert(
        {
          storage_bucket: "public-media",
          storage_path: url,
          title,
          alt_text: title,
          visibility: "public",
        },
        { onConflict: "storage_bucket,storage_path" },
      )
      .select("id")
      .single();

    if (error || !data) {
      setMessage(error?.message ?? "No se pudo guardar la imagen.");
      return null;
    }

    return data.id as string;
  }

  async function getUniqueDojoSlug(
    rawSlug: string,
    locale: Locale,
    dojoId: string,
    city: string,
  ) {
    const baseSlug = slugify(rawSlug) || slugify(city) || "dojo";
    const citySlug = slugify(city);
    const { data, error } = await supabase
      .from("dojo_translations")
      .select("dojo_id,slug")
      .eq("language_code", locale)
      .like("slug", `${baseSlug}%`);

    if (error) {
      return baseSlug;
    }

    const taken = new Set(
      ((data ?? []) as Array<{ dojo_id: string; slug: string }>)
        .filter((translation) => translation.dojo_id !== dojoId)
        .map((translation) => translation.slug),
    );

    if (!taken.has(baseSlug)) {
      return baseSlug;
    }

    if (citySlug) {
      const cityCandidate = `${baseSlug}-${citySlug}`;
      if (!taken.has(cityCandidate)) {
        return cityCandidate;
      }
    }

    for (let index = 2; index < 100; index += 1) {
      const numberedCandidate = `${baseSlug}-${index}`;
      if (!taken.has(numberedCandidate)) {
        return numberedCandidate;
      }
    }

    return `${baseSlug}-${Date.now()}`;
  }

  if (!session) {
    return (
      <section className="mt-8 border border-[var(--line)] bg-white p-5">
        <h2 className="text-2xl font-semibold">Países y dojos</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Entra primero en el admin para editar países y dojos.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-8 border border-[var(--line)] bg-white p-5">
      <div className="flex items-start gap-3">
        <Flag size={22} className="mt-1 text-[var(--accent)]" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            CMS
          </p>
          <h2 className="mt-2 text-2xl font-semibold">Países y dojos</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
            Gestiona países, logos, responsables y dojos asociados. Las fichas
            públicas se actualizan desde Supabase.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="grid gap-5">
          <CountryList
            countries={countries}
            mediaById={mediaById}
            displayLocale={countryForm.locale}
            loading={loading}
            saving={saving}
            onImportExisting={importExistingCountries}
            onEdit={editCountry}
            onDelete={deleteCountry}
          />
          <DojoList
            dojos={dojos}
            countries={countries}
            displayLocale={dojoForm.locale}
            loading={loading}
            onEdit={editDojo}
            onDelete={deleteDojo}
          />
        </div>

        <div className="grid gap-5">
          <CountryFormView
            form={countryForm}
            setForm={setCountryForm}
            onLocaleChange={changeCountryFormLocale}
            saving={saving}
            uploadingField={uploadingField}
            onUploadImage={uploadPublicImage}
            onSave={saveCountry}
            onReset={() =>
              setCountryForm(createEmptyCountryForm(countryForm.locale))
            }
          />
          <DojoFormView
            form={dojoForm}
            setForm={setDojoForm}
            onLocaleChange={changeDojoFormLocale}
            countries={countries}
            saving={saving}
            uploadingField={uploadingField}
            onUploadImage={uploadPublicImage}
            onSave={saveDojo}
            onReset={() => setDojoForm(createEmptyDojoForm(dojoForm.locale))}
          />
        </div>
      </div>

      {message ? (
        <p className="mt-5 text-sm font-semibold text-[var(--accent)]">
          {message}
        </p>
      ) : null}
    </section>
  );
}

function CountryList({
  countries,
  mediaById,
  displayLocale,
  loading,
  saving,
  onImportExisting,
  onEdit,
  onDelete,
}: {
  countries: CountryRow[];
  mediaById: Map<string, MediaRow>;
  displayLocale: Locale;
  loading: boolean;
  saving: boolean;
  onImportExisting: () => void;
  onEdit: (country: CountryRow) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <details className="border border-[var(--line)] p-4">
      <summary className="cursor-pointer text-xl font-semibold">
        Países ({countries.length})
      </summary>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          onClick={onImportExisting}
          disabled={saving || loading}
          className="inline-flex items-center gap-2 bg-[var(--ink-blue)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          Importar países existentes
        </button>
      </div>
      <div className="mt-4 grid gap-3">
        {loading ? (
          <p className="text-sm text-[var(--muted)]">Cargando países...</p>
        ) : countries.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            Aún no hay países en Supabase. Importa los existentes para empezar
            a editarlos.
          </p>
        ) : (
          countries.map((country) => {
            const name =
              country.country_translations.find(
                (translation) => translation.language_code === displayLocale,
              )?.name ??
              country.country_translations[0]?.name ??
              country.code;
            const logoUrl = getMediaUrl(country.flag_media_id, mediaById);

            return (
              <article key={country.id} className="border border-[var(--line)] p-4">
                <div className="flex items-start gap-3">
                  {logoUrl ? (
                    <Image
                      src={logoUrl}
                      alt={`${name} logo`}
                      width={48}
                      height={48}
                      className="size-12 object-contain"
                    />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
                      {country.status} · {country.is_public ? "Público" : "Oculto"}
                    </p>
                    <h4 className="mt-1 text-lg font-semibold">{name}</h4>
                    <p className="text-sm text-[var(--muted)]">{country.code}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => onEdit(country)}
                    className="border border-[var(--line)] px-3 py-2 text-sm font-semibold"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => onDelete(country.id)}
                    className="inline-flex items-center gap-2 border border-[var(--line)] px-3 py-2 text-sm font-semibold text-[var(--accent)]"
                  >
                    <Trash2 size={15} />
                    Borrar
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>
    </details>
  );
}

function DojoList({
  dojos,
  countries,
  displayLocale,
  loading,
  onEdit,
  onDelete,
}: {
  dojos: DojoRow[];
  countries: CountryRow[];
  displayLocale: Locale;
  loading: boolean;
  onEdit: (dojo: DojoRow) => void;
  onDelete: (id: string) => void;
}) {
  const countryNameById = new Map(
    countries.map((country) => [
      country.id,
      country.country_translations.find(
        (translation) => translation.language_code === displayLocale,
      )?.name ??
        country.country_translations[0]?.name ??
        country.code,
    ]),
  );

  return (
    <details className="border border-[var(--line)] p-4">
      <summary className="cursor-pointer text-xl font-semibold">
        Dojos ({dojos.length})
      </summary>
      <div className="mt-4 grid gap-3">
        {loading ? (
          <p className="text-sm text-[var(--muted)]">Cargando dojos...</p>
        ) : dojos.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Aún no hay dojos.</p>
        ) : (
          dojos.map((dojo) => {
            const name =
              dojo.dojo_translations.find(
                (translation) => translation.language_code === displayLocale,
              )?.name ??
              dojo.dojo_translations[0]?.name ??
              dojo.city;

            return (
              <article key={dojo.id} className="border border-[var(--line)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
                  {dojo.status} · {countryNameById.get(dojo.country_id) ?? ""}
                </p>
                <h4 className="mt-1 text-lg font-semibold">{name}</h4>
                <p className="text-sm text-[var(--muted)]">{dojo.city}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => onEdit(dojo)}
                    className="border border-[var(--line)] px-3 py-2 text-sm font-semibold"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => onDelete(dojo.id)}
                    className="inline-flex items-center gap-2 border border-[var(--line)] px-3 py-2 text-sm font-semibold text-[var(--accent)]"
                  >
                    <Trash2 size={15} />
                    Borrar
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>
    </details>
  );
}

function CountryFormView({
  form,
  setForm,
  onLocaleChange,
  saving,
  uploadingField,
  onUploadImage,
  onSave,
  onReset,
}: {
  form: CountryForm;
  setForm: React.Dispatch<React.SetStateAction<CountryForm>>;
  onLocaleChange: (locale: Locale) => void;
  saving: boolean;
  uploadingField: string | null;
  onUploadImage: UploadImageFn;
  onSave: () => void;
  onReset: () => void;
}) {
  return (
    <details className="border border-[var(--line)] p-4">
      <summary className="cursor-pointer">
        <span className="inline-flex items-center gap-2 text-xl font-semibold">
        <Flag size={20} className="text-[var(--accent)]" />
          {form.id ? "Editar país" : "Nuevo país"}
        </span>
      </summary>
      <div className="mt-4 grid gap-3">
        <AdminSelect
          label="Idioma"
          value={form.locale}
          onChange={(value) => onLocaleChange(value as Locale)}
          options={locales.map((locale) => ({
            value: locale.key,
            label: locale.label,
          }))}
        />
        <div className="grid gap-3 md:grid-cols-2">
          <TextInput
            label="Código país"
            value={form.code}
            onChange={(value) =>
              setForm((current) => ({ ...current, code: value.toUpperCase() }))
            }
          />
          <AdminSelect
            label="Estado"
            value={form.status}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                status: value as ContentStatus,
              }))
            }
            options={statusOptions}
          />
        </div>
        <Checkbox
          label="Visible en la web pública"
          checked={form.isPublic}
          onChange={(checked) =>
            setForm((current) => ({ ...current, isPublic: checked }))
          }
        />
        <TextInput
          label="Nombre"
          value={form.name}
          onChange={(value) =>
            setForm((current) => ({
              ...current,
              name: value,
              slug: current.slug || slugify(value),
            }))
          }
        />
        <TextInput
          label="Slug"
          value={form.slug}
          onChange={(value) =>
            setForm((current) => ({ ...current, slug: slugify(value) }))
          }
        />
        <TextArea
          label="Información del país"
          value={form.description}
          onChange={(value) =>
            setForm((current) => ({ ...current, description: value }))
          }
        />
        <div className="grid gap-3 md:grid-cols-2">
          <TextInput
            label="Responsable"
            value={form.responsiblePerson}
            onChange={(value) =>
              setForm((current) => ({ ...current, responsiblePerson: value }))
            }
          />
          <TextInput
            label="Email responsable"
            value={form.responsibleEmail}
            onChange={(value) =>
              setForm((current) => ({ ...current, responsibleEmail: value }))
            }
          />
        </div>
        <ImageUploadField
          label="Bandera del país"
          helperText="Solo bandera oficial del país. Si no se sube una imagen, la web usará una bandera automática por código de país cuando sea posible."
          value={form.logoUrl}
          uploading={uploadingField === "country-logo"}
          onUpload={async (file) => {
            const url = await onUploadImage(file, "country-logo");
            if (url) {
              setForm((current) => ({ ...current, logoUrl: url }));
            }
          }}
          onClear={() => setForm((current) => ({ ...current, logoUrl: "" }))}
        />
        <FormButtons
          saving={saving}
          disabled={!form.code || !form.name}
          onSave={onSave}
          onReset={onReset}
        />
      </div>
    </details>
  );
}

function DojoFormView({
  form,
  setForm,
  onLocaleChange,
  countries,
  saving,
  uploadingField,
  onUploadImage,
  onSave,
  onReset,
}: {
  form: DojoForm;
  setForm: React.Dispatch<React.SetStateAction<DojoForm>>;
  onLocaleChange: (locale: Locale) => void;
  countries: CountryRow[];
  saving: boolean;
  uploadingField: string | null;
  onUploadImage: UploadImageFn;
  onSave: () => void;
  onReset: () => void;
}) {
  return (
    <details className="border border-[var(--line)] p-4">
      <summary className="cursor-pointer">
        <span className="inline-flex items-center gap-2 text-xl font-semibold">
        <Building2 size={20} className="text-[var(--accent)]" />
          {form.id ? "Editar dojo" : "Nuevo dojo"}
        </span>
      </summary>
      <div className="mt-4 grid gap-3">
        <AdminSelect
          label="País"
          value={form.countryId}
          onChange={(value) =>
            setForm((current) => ({ ...current, countryId: value }))
          }
          options={[
            { value: "", label: "Selecciona país" },
            ...countries.map((country) => ({
              value: country.id,
              label:
                country.country_translations.find(
                  (translation) => translation.language_code === form.locale,
                )?.name ??
                country.country_translations[0]?.name ??
                country.code,
            })),
          ]}
        />
        <AdminSelect
          label="Idioma"
          value={form.locale}
          onChange={(value) => onLocaleChange(value as Locale)}
          options={locales.map((locale) => ({
            value: locale.key,
            label: locale.label,
          }))}
        />
        <div className="grid gap-3 md:grid-cols-2">
          <AdminSelect
            label="Estado"
            value={form.status}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                status: value as ContentStatus,
              }))
            }
            options={statusOptions}
          />
          <TextInput
            label="Ciudad"
            value={form.city}
            onChange={(value) =>
              setForm((current) => ({ ...current, city: value }))
            }
          />
        </div>
        <Checkbox
          label="Visible en la web pública"
          checked={form.isPublic}
          onChange={(checked) =>
            setForm((current) => ({ ...current, isPublic: checked }))
          }
        />
        <TextInput
          label="Nombre dojo"
          value={form.name}
          onChange={(value) =>
            setForm((current) => ({
              ...current,
              name: value,
              slug: current.slug || slugify(value),
            }))
          }
        />
        <TextInput
          label="Slug"
          value={form.slug}
          onChange={(value) =>
            setForm((current) => ({ ...current, slug: slugify(value) }))
          }
        />
        <TextArea
          label="Información, horarios y notas"
          value={form.description}
          onChange={(value) =>
            setForm((current) => ({ ...current, description: value }))
          }
        />
        <TextInput
          label="Dirección"
          value={form.address}
          onChange={(value) =>
            setForm((current) => ({ ...current, address: value }))
          }
        />
        <TextInput
          label="Instructor responsable"
          value={form.responsibleInstructor}
          onChange={(value) =>
            setForm((current) => ({
              ...current,
              responsibleInstructor: value,
            }))
          }
        />
        <div className="grid gap-3 md:grid-cols-2">
          <TextInput
            label="Email"
            value={form.email}
            onChange={(value) =>
              setForm((current) => ({ ...current, email: value }))
            }
          />
          <TextInput
            label="Teléfono"
            value={form.phone}
            onChange={(value) =>
              setForm((current) => ({ ...current, phone: value }))
            }
          />
        </div>
        <TextInput
          label="Página web"
          value={form.website}
          onChange={(value) =>
            setForm((current) => ({ ...current, website: value }))
          }
        />
        <ImageUploadField
          label="Logo de kempo del dojo"
          helperText="Solo logo del club o dojo. No subir fotos generales del dojo ni imágenes de entrenamientos en este campo."
          value={form.imageUrl}
          uploading={uploadingField === "dojo-main-image"}
          onUpload={async (file) => {
            const url = await onUploadImage(file, "dojo-main-image");
            if (url) {
              setForm((current) => ({ ...current, imageUrl: url }));
            }
          }}
          onClear={() => setForm((current) => ({ ...current, imageUrl: "" }))}
        />
        <FormButtons
          saving={saving}
          disabled={!form.countryId || !form.city || !form.name}
          onSave={onSave}
          onReset={onReset}
        />
      </div>
    </details>
  );
}

const statusOptions = [
  { value: "draft", label: "Borrador" },
  { value: "published", label: "Publicado" },
  { value: "archived", label: "Archivado" },
];

function FormButtons({
  saving,
  disabled,
  onSave,
  onReset,
}: {
  saving: boolean;
  disabled: boolean;
  onSave: () => void;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      <button
        onClick={onSave}
        disabled={saving || disabled}
        className="inline-flex items-center gap-2 bg-[var(--accent)] px-4 py-2 font-semibold text-white disabled:opacity-50"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        Guardar
      </button>
      <button
        onClick={onReset}
        className="inline-flex items-center gap-2 border border-[var(--line)] px-4 py-2 font-semibold"
      >
        <Plus size={16} />
        Nuevo
      </button>
    </div>
  );
}

function AdminSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="border border-[var(--line)] px-3 py-2 font-normal"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 text-sm font-semibold">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  );
}

function TextInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="border border-[var(--line)] px-3 py-2 font-normal"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        className="resize-y border border-[var(--line)] px-3 py-2 font-normal"
      />
    </label>
  );
}

function ImageUploadField({
  label,
  helperText,
  value,
  uploading,
  onUpload,
  onClear,
}: {
  label: string;
  helperText?: string;
  value: string;
  uploading: boolean;
  onUpload: (file: File) => void;
  onClear: () => void;
}) {
  return (
    <div className="grid gap-2 text-sm font-semibold">
      <span>{label}</span>
      {helperText ? (
        <p className="text-xs font-normal leading-5 text-[var(--muted)]">
          {helperText}
        </p>
      ) : null}
      <div className="border border-[var(--line)] bg-[var(--paper)] p-3">
        {value ? (
          <div
            className="mb-3 h-36 border border-[var(--line)] bg-white bg-contain bg-center bg-no-repeat"
            style={{ backgroundImage: `url("${value}")` }}
            aria-label={`Vista previa: ${label}`}
          />
        ) : (
          <div className="mb-3 flex h-28 items-center justify-center border border-dashed border-[var(--line)] bg-white text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
            Sin imagen
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 bg-[var(--ink-blue)] px-3 py-2 text-sm font-semibold text-white">
            {uploading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <ImagePlus size={16} />
            )}
            {value ? "Cambiar imagen" : "Subir imagen"}
            <input
              type="file"
              accept="image/*"
              disabled={uploading}
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) {
                  onUpload(file);
                }
              }}
            />
          </label>
          {value ? (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex items-center gap-2 border border-[var(--line)] px-3 py-2 text-sm font-semibold"
            >
              <X size={16} />
              Quitar imagen
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function hydrateCountryForm(
  country: CountryRow,
  locale: Locale,
  mediaById: Map<string, MediaRow>,
): CountryForm {
  const translation = country.country_translations.find(
    (item) => item.language_code === locale,
  );

  return {
    id: country.id,
    locale,
    code: country.code,
    status: country.status,
    isPublic: country.is_public,
    name: translation?.name ?? "",
    slug: translation?.slug ?? "",
    description: translation?.description ?? "",
    responsiblePerson: country.responsible_person ?? "",
    responsibleEmail: country.responsible_email ?? "",
    logoUrl: getMediaUrl(country.flag_media_id, mediaById),
    imageUrl: getMediaUrl(country.main_image_media_id, mediaById),
  };
}

function hydrateDojoForm(
  dojo: DojoRow,
  locale: Locale,
  mediaById: Map<string, MediaRow>,
): DojoForm {
  const translation = dojo.dojo_translations.find(
    (item) => item.language_code === locale,
  );

  return {
    id: dojo.id,
    locale,
    countryId: dojo.country_id,
    status: dojo.status,
    isPublic: dojo.is_public,
    name: translation?.name ?? "",
    slug: translation?.slug ?? "",
    description: translation?.description ?? "",
    city: dojo.city,
    address: dojo.address ?? "",
    responsibleInstructor: dojo.responsible_instructor ?? "",
    email: dojo.email ?? "",
    phone: dojo.phone ?? "",
    website: dojo.website ?? "",
    imageUrl: getMediaUrl(dojo.main_image_media_id, mediaById),
  };
}

function getMediaUrl(id: string | null, mediaById: Map<string, MediaRow>) {
  return id ? mediaById.get(id)?.storage_path ?? "" : "";
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
