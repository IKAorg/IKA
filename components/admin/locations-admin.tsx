"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Building2, Flag, Loader2, Plus, Save, Trash2 } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/browser";
import type { Locale } from "@/lib/i18n/config";
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

const locales: Array<{ key: Locale; label: string }> = [
  { key: "en", label: "English" },
  { key: "es", label: "Español" },
  { key: "it", label: "Italiano" },
  { key: "fr", label: "Français" },
  { key: "ja", label: "日本語" },
  { key: "zh", label: "中文" },
  { key: "cs", label: "Čeština" },
];

const emptyCountryForm: CountryForm = {
  locale: "es",
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

const emptyDojoForm: DojoForm = {
  locale: "es",
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

export function LocationsAdmin() {
  const supabase = useMemo(() => createClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [countries, setCountries] = useState<CountryRow[]>([]);
  const [dojos, setDojos] = useState<DojoRow[]>([]);
  const [mediaById, setMediaById] = useState<Map<string, MediaRow>>(new Map());
  const [countryForm, setCountryForm] = useState<CountryForm>(emptyCountryForm);
  const [dojoForm, setDojoForm] = useState<DojoForm>(emptyDojoForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    const translation =
      country.country_translations.find(
        (item) => item.language_code === countryForm.locale,
      ) ?? country.country_translations[0];

    setCountryForm({
      id: country.id,
      locale: (translation?.language_code ?? countryForm.locale) as Locale,
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
    });
  }

  function editDojo(dojo: DojoRow) {
    const translation =
      dojo.dojo_translations.find(
        (item) => item.language_code === dojoForm.locale,
      ) ?? dojo.dojo_translations[0];

    setDojoForm({
      id: dojo.id,
      locale: (translation?.language_code ?? dojoForm.locale) as Locale,
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
    });
  }

  async function saveCountry() {
    setSaving(true);
    setMessage("");

    const logoMediaId = await saveExternalMedia(
      countryForm.logoUrl,
      `${countryForm.name} logo`,
    );
    const imageMediaId = await saveExternalMedia(
      countryForm.imageUrl,
      countryForm.name,
    );

    const payload = {
      code: countryForm.code.toUpperCase(),
      status: countryForm.status,
      is_public: countryForm.isPublic,
      responsible_person: countryForm.responsiblePerson || null,
      responsible_email: countryForm.responsibleEmail || null,
      flag_media_id: logoMediaId,
      main_image_media_id: imageMediaId,
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

    setCountryForm(emptyCountryForm);
    setMessage("País guardado.");
    await loadLocations();
    setSaving(false);
  }

  async function saveDojo() {
    setSaving(true);
    setMessage("");

    const imageMediaId = await saveExternalMedia(dojoForm.imageUrl, dojoForm.name);
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
    const { error } = await supabase.from("dojo_translations").upsert(
      {
        dojo_id: dojoId,
        language_code: dojoForm.locale,
        name: dojoForm.name,
        slug: dojoForm.slug || slugify(dojoForm.name),
        description: dojoForm.description || null,
      },
      { onConflict: "dojo_id,language_code" },
    );

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    setDojoForm(emptyDojoForm);
    setMessage("Dojo guardado.");
    await loadLocations();
    setSaving(false);
  }

  async function importExistingCountries() {
    setSaving(true);
    setMessage("");

    const existingCodes = new Set(countries.map((country) => country.code));
    const seeds = legacyCountrySeeds.filter(
      (country) => !existingCodes.has(country.code),
    );

    if (seeds.length === 0) {
      setMessage("Los países existentes ya están importados.");
      setSaving(false);
      return;
    }

    for (const seed of seeds) {
      const spanishName =
        getPublicPageContent("es", "countries").countries?.[seed.index] ??
        seed.code;
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

      const countryId = countryResult.data.id as string;
      const translations = locales.map((locale) => {
        const name =
          getPublicPageContent(locale.key, "countries").countries?.[
            seed.index
          ] ?? spanishName;

        return {
          country_id: countryId,
          language_code: locale.key,
          name,
          slug: slugify(name),
          description: null,
        };
      });

      const { error } = await supabase
        .from("country_translations")
        .insert(translations);

      if (error) {
        setMessage(error.message);
        setSaving(false);
        return;
      }
    }

    setMessage("Países existentes importados al CMS.");
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

  async function saveExternalMedia(url: string, title: string) {
    if (!url) {
      return null;
    }

    const { data, error } = await supabase
      .from("media_library")
      .upsert(
        {
          storage_bucket: "external",
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
            loading={loading}
            saving={saving}
            onImportExisting={importExistingCountries}
            onEdit={editCountry}
            onDelete={deleteCountry}
          />
          <DojoList
            dojos={dojos}
            countries={countries}
            loading={loading}
            onEdit={editDojo}
            onDelete={deleteDojo}
          />
        </div>

        <div className="grid gap-5">
          <CountryFormView
            form={countryForm}
            setForm={setCountryForm}
            saving={saving}
            onSave={saveCountry}
            onReset={() => setCountryForm(emptyCountryForm)}
          />
          <DojoFormView
            form={dojoForm}
            setForm={setDojoForm}
            countries={countries}
            saving={saving}
            onSave={saveDojo}
            onReset={() => setDojoForm(emptyDojoForm)}
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
  loading,
  saving,
  onImportExisting,
  onEdit,
  onDelete,
}: {
  countries: CountryRow[];
  mediaById: Map<string, MediaRow>;
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
                (translation) => translation.language_code === "es",
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
  loading,
  onEdit,
  onDelete,
}: {
  dojos: DojoRow[];
  countries: CountryRow[];
  loading: boolean;
  onEdit: (dojo: DojoRow) => void;
  onDelete: (id: string) => void;
}) {
  const countryNameById = new Map(
    countries.map((country) => [
      country.id,
      country.country_translations[0]?.name ?? country.code,
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
                (translation) => translation.language_code === "es",
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
  saving,
  onSave,
  onReset,
}: {
  form: CountryForm;
  setForm: React.Dispatch<React.SetStateAction<CountryForm>>;
  saving: boolean;
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
          onChange={(value) =>
            setForm((current) => ({ ...current, locale: value as Locale }))
          }
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
        <TextInput
          label="Logo país / URL"
          value={form.logoUrl}
          onChange={(value) =>
            setForm((current) => ({ ...current, logoUrl: value }))
          }
        />
        <TextInput
          label="Foto principal / URL"
          value={form.imageUrl}
          onChange={(value) =>
            setForm((current) => ({ ...current, imageUrl: value }))
          }
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
  countries,
  saving,
  onSave,
  onReset,
}: {
  form: DojoForm;
  setForm: React.Dispatch<React.SetStateAction<DojoForm>>;
  countries: CountryRow[];
  saving: boolean;
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
              label: country.country_translations[0]?.name ?? country.code,
            })),
          ]}
        />
        <AdminSelect
          label="Idioma"
          value={form.locale}
          onChange={(value) =>
            setForm((current) => ({ ...current, locale: value as Locale }))
          }
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
        <TextInput
          label="Foto dojo / URL"
          value={form.imageUrl}
          onChange={(value) =>
            setForm((current) => ({ ...current, imageUrl: value }))
          }
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
