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
import { createClient } from "@/lib/supabase/browser";
import { optimizeImageForUpload } from "@/lib/media/optimize-image";
import { getAdminSessionBridgeHeaders } from "@/lib/supabase/admin-session-bridge";
import { defaultLocale, localeLabels, type Locale } from "@/lib/i18n/config";
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
  ika_country_id?: string | null;
  status: ContentStatus;
  is_public: boolean;
  responsible_person: string | null;
  representative_entity: string | null;
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
  ika_dojo_id?: string | null;
  city: string;
  address: string | null;
  responsible_instructor: string | null;
  responsible_instructor_media_id: string | null;
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
  slugTouched: boolean;
  description: string;
  responsiblePerson: string;
  representativeEntity: string;
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
  slugTouched: boolean;
  description: string;
  city: string;
  address: string;
  responsibleInstructor: string;
  responsibleInstructorPhotoUrl: string;
  email: string;
  phone: string;
  website: string;
  imageUrl: string;
};

type UploadImageFn = (file: File, scope: string) => Promise<string | null>;

type LocationScope = {
  isGlobal: boolean;
  countryIds: string[];
  dojoIds: string[];
  roleKeys: string[];
};

const locales: Array<{ key: Locale; label: string }> = (
  Object.entries(localeLabels) as Array<[Locale, string]>
).map(([key, label]) => ({ key, label }));

function createEmptyCountryForm(locale: Locale): CountryForm {
  return {
    locale,
    code: "",
    status: "published",
    isPublic: true,
    name: "",
    slug: "",
    slugTouched: false,
    description: "",
    responsiblePerson: "",
    representativeEntity: "",
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
    slugTouched: false,
    description: "",
    city: "",
    address: "",
    responsibleInstructor: "",
    responsibleInstructorPhotoUrl: "",
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
  const copy = locationsAdminCopy(initialLocale);
  const supabase = useMemo(() => createClient(), []);
  const [countries, setCountries] = useState<CountryRow[]>([]);
  const [dojos, setDojos] = useState<DojoRow[]>([]);
  const [mediaById, setMediaById] = useState<Map<string, MediaRow>>(new Map());
  const [scope, setScope] = useState<LocationScope | null>(null);
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
  const [countryCsvText, setCountryCsvText] = useState("");
  const [dojoCsvText, setDojoCsvText] = useState("");

  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    return token
      ? { Authorization: `Bearer ${token}` }
      : getAdminSessionBridgeHeaders();
  }, [supabase]);

  const loadLocations = useCallback(async () => {
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/admin/locations", {
      cache: "no-store",
      headers: await getAuthHeaders(),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(data.error ?? copy.loadLocationsError);
      setCountries([]);
      setDojos([]);
      setMediaById(new Map());
      setScope(null);
      setLoading(false);
      return;
    }

    const nextCountries = (data.countries ?? []) as CountryRow[];
    const nextDojos = (data.dojos ?? []) as DojoRow[];
    const nextScope = (data.scope ?? null) as LocationScope | null;

    const nextMediaById = new Map(
      ((data.media ?? []) as MediaRow[]).map((media) => [media.id, media]),
    );

    setCountries(nextCountries);
    setDojos(nextDojos);
    setMediaById(nextMediaById);
    setScope(nextScope);
    if (nextScope?.isGlobal === false && nextCountries.length === 1) {
      setCountryForm((current) =>
        current.id
          ? current
          : hydrateCountryForm(nextCountries[0], current.locale, nextMediaById),
      );
    }
    setLoading(false);
    return;
  }, [getAuthHeaders]);

  useEffect(() => {
    supabase.auth.getSession().then(() => {
      void loadLocations();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED") {
        return;
      }

      void loadLocations();
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

    const response = await fetch("/api/admin/locations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(await getAuthHeaders()),
      },
      body: JSON.stringify({
        action: "save_country",
        country: {
          ...countryForm,
          flagMediaUrl: countryForm.logoUrl || null,
        },
      }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(data.error ?? copy.saveCountryError);
      setSaving(false);
      return;
    }

    setCountryForm(createEmptyCountryForm(countryForm.locale));
    setMessage(copy.countrySaved);
    await loadLocations();
    setSaving(false);
    return;
    /*

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

    const countryId = countryResult.data!.id as string;
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
      setMessage(error!.message);
      setSaving(false);
      return;
    }

    setCountryForm(createEmptyCountryForm(countryForm.locale));
    setMessage("País guardado.");
    await loadLocations();
    setSaving(false);
    */
  }

  async function saveDojo() {
    setSaving(true);
    setMessage("");

    const response = await fetch("/api/admin/locations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(await getAuthHeaders()),
      },
      body: JSON.stringify({
        action: "save_dojo",
        dojo: {
          ...dojoForm,
          countryId: dojoForm.countryId || countries[0]?.id || "",
          mainImageMediaUrl: dojoForm.imageUrl || null,
          responsibleInstructorMediaUrl:
            dojoForm.responsibleInstructorPhotoUrl || null,
        },
      }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(data.error ?? copy.saveDojoError);
      setSaving(false);
      return;
    }

    setDojoForm(createEmptyDojoForm(dojoForm.locale));
    setMessage(copy.dojoSaved);
    await loadLocations();
    setSaving(false);
    return;
    /*

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

    const dojoId = dojoResult.data!.id as string;
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
      setMessage(error!.message);
      setSaving(false);
      return;
    }

    setDojoForm(createEmptyDojoForm(dojoForm.locale));
    setMessage("Dojo guardado.");
    await loadLocations();
    setSaving(false);
    */
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
    const response = await fetch("/api/admin/locations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(await getAuthHeaders()),
      },
      body: JSON.stringify({ action: "delete_country", countryId: id }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(data.error ?? copy.deleteCountryError);
      return;
    }

    setMessage(copy.countryDeleted);
    await loadLocations();
    return;

    const { error } = await supabase.from("countries").delete().eq("id", id);

    if (error) {
      setMessage(error!.message);
      return;
    }

    setMessage("País eliminado.");
    await loadLocations();
  }

  async function deleteDojo(id: string) {
    const response = await fetch("/api/admin/locations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(await getAuthHeaders()),
      },
      body: JSON.stringify({ action: "delete_dojo", dojoId: id }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(data.error ?? copy.deleteDojoError);
      return;
    }

    setMessage(copy.dojoDeleted);
    await loadLocations();
    return;

    const { error } = await supabase.from("dojos").delete().eq("id", id);

    if (error) {
      setMessage(error!.message);
      return;
    }

    setMessage("Dojo eliminado.");
    await loadLocations();
  }

  async function importCountriesCsv() {
    setSaving(true);
    setMessage("");

    const response = await fetch("/api/admin/locations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(await getAuthHeaders()),
      },
      body: JSON.stringify({ action: "import_countries_csv", csv: countryCsvText }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(data.error ?? copy.importCountriesError);
      setSaving(false);
      return;
    }

    setCountryCsvText("");
    setMessage(
      `${copy.importSummary}: ${data.imported ?? 0} ${copy.created}, ${data.updated ?? 0} ${copy.updated}, ${data.skipped ?? 0} ${copy.skipped}.`,
    );
    await loadLocations();
    setSaving(false);
  }

  async function importDojosCsv() {
    setSaving(true);
    setMessage("");

    const response = await fetch("/api/admin/locations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(await getAuthHeaders()),
      },
      body: JSON.stringify({ action: "import_dojos_csv", csv: dojoCsvText }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(data.error ?? copy.importDojosError);
      setSaving(false);
      return;
    }

    setDojoCsvText("");
    setMessage(
      `${copy.importSummary}: ${data.imported ?? 0} ${copy.created}, ${data.updated ?? 0} ${copy.updated}, ${data.skipped ?? 0} ${copy.skipped}.`,
    );
    await loadLocations();
    setSaving(false);
  }

  async function readCsvFile(
    file: File,
    setter: React.Dispatch<React.SetStateAction<string>>,
  ) {
    const text = await file.text();
    setter(text);
  }

  async function uploadPublicImage(file: File, scope: string) {
    if (!file.type.startsWith("image/")) {
      setMessage(copy.selectImageFile);
      return null;
    }

    setUploadingField(scope);
    setMessage("");
    const optimizedFile = await optimizeImageForUpload(file, {
      maxWidth: 1800,
      maxHeight: 1800,
      quality: 0.8,
      maxBytes: 520 * 1024,
      outputType: "image/webp",
      fileNameBase: `${scope}-${file.name}`,
    });

    const extension = optimizedFile.name.split(".").pop()?.toLowerCase() || "webp";
    const safeScope = slugify(scope) || "image";
    const safeName =
      slugify(optimizedFile.name.replace(/\.[^.]+$/, "")) || `imagen-${Date.now()}`;
    const storagePath = `locations/${safeScope}/${Date.now()}-${safeName}.${extension}`;

    const { error } = await supabase.storage
      .from("public-media")
      .upload(storagePath, optimizedFile, {
        cacheControl: "31536000",
        contentType: optimizedFile.type,
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

  const isGlobalScope = scope?.isGlobal === true;
  const isSuperAdminScope = scope?.roleKeys?.includes("super_admin") === true;
  const canEditCountry = isGlobalScope || (scope?.countryIds.length ?? 0) > 0;
  const canCreateCountry = isSuperAdminScope;

  return (
    <section className="mt-8 border border-[var(--line)] bg-white p-5">
      <div className="flex items-start gap-3">
        <Flag size={22} className="mt-1 text-[var(--accent)]" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            CMS
          </p>
          <h2 className="mt-2 text-2xl font-semibold">{copy.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
            {copy.intro}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="grid gap-5">
          {canEditCountry ? (
            <CountryList
              countries={countries}
              mediaById={mediaById}
              displayLocale={countryForm.locale}
              loading={loading}
              saving={saving}
              canImport={canCreateCountry}
              canDelete={isSuperAdminScope}
              onImportExisting={importExistingCountries}
              onEdit={editCountry}
              onDelete={deleteCountry}
              copy={copy}
            />
          ) : null}
          <DojoList
            dojos={dojos}
            countries={countries}
            displayLocale={dojoForm.locale}
            loading={loading}
            onEdit={editDojo}
            onDelete={deleteDojo}
            copy={copy}
          />
        </div>

        <div className="grid gap-5">
          {canCreateCountry ? (
            <CsvImportPanel
              title={copy.importCountriesTitle}
              description={copy.importCountriesDescription}
              csvText={countryCsvText}
              setCsvText={setCountryCsvText}
              saving={saving}
              buttonLabel={copy.importCountriesButton}
              helper={copy.importCountriesHelper}
              uploadLabel={copy.uploadCsv}
              onImport={importCountriesCsv}
              onFile={async (file) => readCsvFile(file, setCountryCsvText)}
            />
          ) : null}
          {canEditCountry ? (
            <CsvImportPanel
              title={copy.importDojosTitle}
              description={copy.importDojosDescription}
              csvText={dojoCsvText}
              setCsvText={setDojoCsvText}
              saving={saving}
              buttonLabel={copy.importDojosButton}
              helper={copy.importDojosHelper}
              uploadLabel={copy.uploadCsv}
              onImport={importDojosCsv}
              onFile={async (file) => readCsvFile(file, setDojoCsvText)}
            />
          ) : null}
          {canEditCountry && (canCreateCountry || Boolean(countryForm.id)) ? (
            <CountryFormView
              form={countryForm}
              setForm={setCountryForm}
              onLocaleChange={changeCountryFormLocale}
              canCreate={canCreateCountry}
              saving={saving}
              uploadingField={uploadingField}
              onUploadImage={uploadPublicImage}
              onSave={saveCountry}
              onReset={() => {
                if (canCreateCountry) {
                  setCountryForm(createEmptyCountryForm(countryForm.locale));
                }
              }}
              copy={copy}
            />
          ) : null}
          <DojoFormView
            form={dojoForm}
            setForm={setDojoForm}
            onLocaleChange={changeDojoFormLocale}
            countries={countries}
            lockCountry={!isGlobalScope && countries.length === 1}
            saving={saving}
            uploadingField={uploadingField}
            onUploadImage={uploadPublicImage}
            onSave={saveDojo}
            onReset={() => setDojoForm(createEmptyDojoForm(dojoForm.locale))}
            copy={copy}
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
  canImport,
  canDelete,
  onImportExisting,
  onEdit,
  onDelete,
  copy,
}: {
  countries: CountryRow[];
  mediaById: Map<string, MediaRow>;
  displayLocale: Locale;
  loading: boolean;
  saving: boolean;
  canImport: boolean;
  canDelete: boolean;
  onImportExisting: () => void;
  onEdit: (country: CountryRow) => void;
  onDelete: (id: string) => void;
  copy: ReturnType<typeof locationsAdminCopy>;
}) {
  return (
    <details className="border border-[var(--line)] p-4">
      <summary className="cursor-pointer text-xl font-semibold">
        {copy.countries} ({countries.length})
      </summary>
      {canImport ? (
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={onImportExisting}
            disabled={saving || loading}
            className="inline-flex items-center gap-2 bg-[var(--ink-blue)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Plus size={16} />
            )}
            {copy.importExistingCountries}
          </button>
        </div>
      ) : null}
      <div className="mt-4 grid gap-3">
        {loading ? (
          <p className="text-sm text-[var(--muted)]">{copy.loadingCountries}</p>
        ) : countries.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            {copy.noCountries}
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
                      {country.status} · {country.is_public ? copy.public : copy.hidden}
                    </p>
                    <h4 className="mt-1 text-lg font-semibold">{name}</h4>
                    <p className="text-sm text-[var(--muted)]">
                      {country.ika_country_id ?? copy.pendingId} · {country.code}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => onEdit(country)}
                    className="border border-[var(--line)] px-3 py-2 text-sm font-semibold"
                  >
                    {copy.edit}
                  </button>
                  {canDelete ? (
                    <button
                      onClick={() => onDelete(country.id)}
                      className="inline-flex items-center gap-2 border border-[var(--line)] px-3 py-2 text-sm font-semibold text-[var(--accent)]"
                    >
                      <Trash2 size={15} />
                      {copy.delete}
                    </button>
                  ) : null}
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
  copy,
}: {
  dojos: DojoRow[];
  countries: CountryRow[];
  displayLocale: Locale;
  loading: boolean;
  onEdit: (dojo: DojoRow) => void;
  onDelete: (id: string) => void;
  copy: ReturnType<typeof locationsAdminCopy>;
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
        {copy.dojos} ({dojos.length})
      </summary>
      <div className="mt-4 grid gap-3">
        {loading ? (
          <p className="text-sm text-[var(--muted)]">{copy.loadingDojos}</p>
        ) : dojos.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">{copy.noDojos}</p>
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
                <p className="text-sm text-[var(--muted)]">
                  {dojo.ika_dojo_id ?? copy.pendingId} - {dojo.city}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => onEdit(dojo)}
                    className="border border-[var(--line)] px-3 py-2 text-sm font-semibold"
                  >
                    {copy.edit}
                  </button>
                  <button
                    onClick={() => onDelete(dojo.id)}
                    className="inline-flex items-center gap-2 border border-[var(--line)] px-3 py-2 text-sm font-semibold text-[var(--accent)]"
                  >
                    <Trash2 size={15} />
                    {copy.delete}
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
  canCreate,
  saving,
  uploadingField,
  onUploadImage,
  onSave,
  onReset,
  copy,
}: {
  form: CountryForm;
  setForm: React.Dispatch<React.SetStateAction<CountryForm>>;
  onLocaleChange: (locale: Locale) => void;
  canCreate: boolean;
  saving: boolean;
  uploadingField: string | null;
  onUploadImage: UploadImageFn;
  onSave: () => void;
  onReset: () => void;
  copy: ReturnType<typeof locationsAdminCopy>;
}) {
  return (
    <details className="border border-[var(--line)] p-4">
      <summary className="cursor-pointer">
        <span className="inline-flex items-center gap-2 text-xl font-semibold">
          <Flag size={20} className="text-[var(--accent)]" />
          {form.id ? copy.editCountry : canCreate ? copy.newCountry : copy.selectCountry}
        </span>
      </summary>
      <div className="mt-4 grid gap-3">
        {!canCreate && !form.id ? (
          <p className="text-sm font-semibold text-[var(--accent)]">
            {copy.selectCountryToEdit}
          </p>
        ) : null}
        <AdminSelect
          label={copy.language}
          value={form.locale}
          onChange={(value) => onLocaleChange(value as Locale)}
          options={locales.map((locale) => ({
            value: locale.key,
            label: locale.label,
          }))}
        />
        <div className="grid gap-3 md:grid-cols-2">
          <TextInput
            label={copy.countryCode}
            value={form.code}
            onChange={(value) =>
              setForm((current) => ({ ...current, code: value.toUpperCase() }))
            }
          />
          <AdminSelect
            label={copy.status}
            value={form.status}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                status: value as ContentStatus,
              }))
            }
            options={statusOptions(copy)}
          />
        </div>
        <Checkbox
          label={copy.visibleOnPublicSite}
          checked={form.isPublic}
          onChange={(checked) =>
            setForm((current) => ({ ...current, isPublic: checked }))
          }
        />
        <TextInput
          label={copy.name}
          value={form.name}
          onChange={(value) =>
            setForm((current) => ({
              ...current,
              name: value,
              slug: current.slugTouched ? current.slug : slugify(value),
            }))
          }
        />
        <TextInput
          label={copy.slug}
          value={form.slug}
          onChange={(value) =>
            setForm((current) => ({
              ...current,
              slug: slugify(value),
              slugTouched: true,
            }))
          }
        />
        <TextArea
          label={copy.countryInfo}
          value={form.description}
          onChange={(value) =>
            setForm((current) => ({ ...current, description: value }))
          }
        />
        <div className="grid gap-3 md:grid-cols-2">
          <TextInput
          label={copy.responsible}
            value={form.responsiblePerson}
            onChange={(value) =>
              setForm((current) => ({ ...current, responsiblePerson: value }))
            }
          />
          <TextInput
          label={copy.representativeEntity}
            value={form.representativeEntity}
            onChange={(value) =>
              setForm((current) => ({ ...current, representativeEntity: value }))
            }
          />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <TextInput
          label={copy.responsibleEmail}
            value={form.responsibleEmail}
            onChange={(value) =>
              setForm((current) => ({ ...current, responsibleEmail: value }))
            }
          />
        </div>
        <ImageUploadField
          label={copy.countryFlag}
          helperText={copy.countryFlagHelp}
          value={form.logoUrl}
          uploading={uploadingField === "country-logo"}
          onUpload={async (file) => {
            const url = await onUploadImage(file, "country-logo");
            if (url) {
              setForm((current) => ({ ...current, logoUrl: url }));
            }
          }}
          onClear={() => setForm((current) => ({ ...current, logoUrl: "" }))}
          copy={copy}
        />
        <FormButtons
          saving={saving}
          disabled={!form.code || !form.name || (!canCreate && !form.id)}
          onSave={onSave}
          onReset={onReset}
          showReset={canCreate}
          copy={copy}
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
  lockCountry = false,
  saving,
  uploadingField,
  onUploadImage,
  onSave,
  onReset,
  copy,
}: {
  form: DojoForm;
  setForm: React.Dispatch<React.SetStateAction<DojoForm>>;
  onLocaleChange: (locale: Locale) => void;
  countries: CountryRow[];
  lockCountry?: boolean;
  saving: boolean;
  uploadingField: string | null;
  onUploadImage: UploadImageFn;
  onSave: () => void;
  onReset: () => void;
  copy: ReturnType<typeof locationsAdminCopy>;
}) {
  const effectiveCountryId = lockCountry ? countries[0]?.id ?? "" : form.countryId;

  return (
    <details className="border border-[var(--line)] p-4">
      <summary className="cursor-pointer">
        <span className="inline-flex items-center gap-2 text-xl font-semibold">
        <Building2 size={20} className="text-[var(--accent)]" />
          {form.id ? copy.editDojo : copy.newDojo}
        </span>
      </summary>
      <div className="mt-4 grid gap-3">
        <AdminSelect
          label={copy.country}
          value={effectiveCountryId}
          disabled={lockCountry}
          onChange={(value) =>
            setForm((current) => ({ ...current, countryId: value }))
          }
          options={[
            { value: "", label: copy.selectCountry },
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
          label={copy.language}
          value={form.locale}
          onChange={(value) => onLocaleChange(value as Locale)}
          options={locales.map((locale) => ({
            value: locale.key,
            label: locale.label,
          }))}
        />
        <div className="grid gap-3 md:grid-cols-2">
          <AdminSelect
            label={copy.status}
            value={form.status}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                status: value as ContentStatus,
              }))
            }
            options={statusOptions(copy)}
          />
          <TextInput
            label={copy.city}
            value={form.city}
            onChange={(value) =>
              setForm((current) => ({ ...current, city: value }))
            }
          />
        </div>
        <Checkbox
          label={copy.visibleOnPublicSite}
          checked={form.isPublic}
          onChange={(checked) =>
            setForm((current) => ({ ...current, isPublic: checked }))
          }
        />
        <TextInput
          label={copy.dojoName}
          value={form.name}
          onChange={(value) =>
            setForm((current) => ({
              ...current,
              name: value,
              slug: current.slugTouched ? current.slug : slugify(value),
            }))
          }
        />
        <TextInput
          label={copy.slug}
          value={form.slug}
          onChange={(value) =>
            setForm((current) => ({
              ...current,
              slug: slugify(value),
              slugTouched: true,
            }))
          }
        />
        <TextArea
          label={copy.dojoInfo}
          value={form.description}
          onChange={(value) =>
            setForm((current) => ({ ...current, description: value }))
          }
        />
        <TextInput
          label={copy.address}
          value={form.address}
          onChange={(value) =>
            setForm((current) => ({ ...current, address: value }))
          }
        />
        <TextInput
          label={copy.responsibleInstructor}
          value={form.responsibleInstructor}
          onChange={(value) =>
            setForm((current) => ({
              ...current,
              responsibleInstructor: value,
            }))
          }
        />
        <ImageUploadField
          label={copy.instructorPhoto}
          helperText={copy.instructorPhotoHelp}
          value={form.responsibleInstructorPhotoUrl}
          uploading={uploadingField === "dojo-instructor-photo"}
          onUpload={async (file) => {
            const url = await onUploadImage(file, "dojo-instructor-photo");
            if (url) {
              setForm((current) => ({
                ...current,
                responsibleInstructorPhotoUrl: url,
              }));
            }
          }}
          onClear={() =>
            setForm((current) => ({
              ...current,
              responsibleInstructorPhotoUrl: "",
            }))
          }
          copy={copy}
        />
        <div className="grid gap-3 md:grid-cols-2">
          <TextInput
            label={copy.email}
            value={form.email}
            onChange={(value) =>
              setForm((current) => ({ ...current, email: value }))
            }
          />
          <TextInput
          label={copy.phone}
            value={form.phone}
            onChange={(value) =>
              setForm((current) => ({ ...current, phone: value }))
            }
          />
        </div>
        <TextInput
          label={copy.website}
          value={form.website}
          onChange={(value) =>
            setForm((current) => ({ ...current, website: value }))
          }
        />
        <ImageUploadField
          label={copy.dojoLogo}
          helperText={copy.dojoLogoHelp}
          value={form.imageUrl}
          uploading={uploadingField === "dojo-main-image"}
          onUpload={async (file) => {
            const url = await onUploadImage(file, "dojo-main-image");
            if (url) {
              setForm((current) => ({ ...current, imageUrl: url }));
            }
          }}
          onClear={() => setForm((current) => ({ ...current, imageUrl: "" }))}
          copy={copy}
        />
        <FormButtons
          saving={saving}
          disabled={!effectiveCountryId || !form.city || !form.name}
          onSave={onSave}
          onReset={onReset}
          showReset
          copy={copy}
        />
      </div>
    </details>
  );
}

function statusOptions(copy: ReturnType<typeof locationsAdminCopy>) {
  return [
    { value: "draft", label: copy.draft },
    { value: "published", label: copy.published },
    { value: "archived", label: copy.archived },
  ];
}

function FormButtons({
  saving,
  disabled,
  onSave,
  onReset,
  showReset = true,
  copy,
}: {
  saving: boolean;
  disabled: boolean;
  onSave: () => void;
  onReset: () => void;
  showReset?: boolean;
  copy: ReturnType<typeof locationsAdminCopy>;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      <button
        onClick={onSave}
        disabled={saving || disabled}
        className="inline-flex items-center gap-2 bg-[var(--accent)] px-4 py-2 font-semibold text-white disabled:opacity-50"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        {copy.save}
      </button>
      {showReset ? (
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 border border-[var(--line)] px-4 py-2 font-semibold"
        >
          <Plus size={16} />
          {copy.new}
        </button>
      ) : null}
    </div>
  );
}

function AdminSelect({
  label,
  value,
  disabled = false,
  onChange,
  options,
}: {
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="border border-[var(--line)] px-3 py-2 font-normal disabled:bg-[var(--paper)]"
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
  copy,
}: {
  label: string;
  helperText?: string;
  value: string;
  uploading: boolean;
  onUpload: (file: File) => void;
  onClear: () => void;
  copy: ReturnType<typeof locationsAdminCopy>;
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
            aria-label={`${copy.preview}: ${label}`}
          />
        ) : (
          <div className="mb-3 flex h-28 items-center justify-center border border-dashed border-[var(--line)] bg-white text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
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
            {value ? copy.changeImage : copy.uploadImage}
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
              {copy.removeImage}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function CsvImportPanel({
  title,
  description,
  csvText,
  setCsvText,
  saving,
  buttonLabel,
  helper,
  uploadLabel,
  onImport,
  onFile,
}: {
  title: string;
  description: string;
  csvText: string;
  setCsvText: React.Dispatch<React.SetStateAction<string>>;
  saving: boolean;
  buttonLabel: string;
  helper: string;
  uploadLabel: string;
  onImport: () => void;
  onFile: (file: File) => void;
}) {
  return (
    <details className="border border-[var(--line)] p-4">
      <summary className="cursor-pointer text-xl font-semibold">{title}</summary>
      <div className="mt-4 grid gap-3">
        <p className="text-sm leading-6 text-[var(--muted)]">{description}</p>
        <label className="inline-flex w-fit cursor-pointer items-center gap-2 border border-[var(--line)] px-3 py-2 text-sm font-semibold">
          <Plus size={16} />
          {uploadLabel}
          <input
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) {
                onFile(file);
              }
            }}
          />
        </label>
        <textarea
          value={csvText}
          onChange={(event) => setCsvText(event.target.value)}
          rows={8}
          className="resize-y border border-[var(--line)] px-3 py-2 font-normal"
        />
        <p className="text-xs text-[var(--muted)]">{helper}</p>
        <button
          onClick={onImport}
          disabled={saving || !csvText.trim()}
          className="inline-flex w-fit items-center gap-2 bg-[var(--accent)] px-4 py-2 font-semibold text-white disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {buttonLabel}
        </button>
      </div>
    </details>
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
    slugTouched: false,
    description: translation?.description ?? "",
    responsiblePerson: country.responsible_person ?? "",
    representativeEntity: country.representative_entity ?? "",
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
    slugTouched: false,
    description: translation?.description ?? "",
    city: dojo.city,
    address: dojo.address ?? "",
    responsibleInstructor: dojo.responsible_instructor ?? "",
    responsibleInstructorPhotoUrl: getMediaUrl(
      dojo.responsible_instructor_media_id,
      mediaById,
    ),
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

function locationsAdminCopy(locale: Locale) {
  const es = locale === "es";

  return {
    loadLocationsError: es
      ? "No se pudieron cargar paises y dojos."
      : "Could not load countries and dojos.",
    countrySaved: es ? "Pais guardado." : "Country saved.",
    countryDeleted: es ? "Pais eliminado." : "Country deleted.",
    saveCountryError: es
      ? "No se pudo guardar el pais."
      : "Could not save the country.",
    saveDojoError: es
      ? "No se pudo guardar el dojo."
      : "Could not save the dojo.",
    dojoSaved: es ? "Dojo guardado." : "Dojo saved.",
    deleteCountryError: es
      ? "No se pudo borrar el pais."
      : "Could not delete the country.",
    deleteDojoError: es
      ? "No se pudo borrar el dojo."
      : "Could not delete the dojo.",
    importCountriesError: es
      ? "No se pudo importar el CSV de paises."
      : "Could not import the countries CSV.",
    importDojosError: es
      ? "No se pudo importar el CSV de dojos."
      : "Could not import the dojos CSV.",
    dojoDeleted: es ? "Dojo eliminado." : "Dojo deleted.",
    selectImageFile: es ? "Selecciona un archivo de imagen." : "Select an image file.",
    importSummary: es ? "Resumen de importacion" : "Import summary",
    created: es ? "creados" : "created",
    updated: es ? "actualizados" : "updated",
    skipped: es ? "omitidos" : "skipped",
    uploadCsv: es ? "Subir CSV" : "Upload CSV",
    title: es ? "Paises y dojos" : "Countries and dojos",
    intro: es
      ? "Gestiona paises, logos, responsables y dojos asociados. Las fichas publicas se actualizan desde Supabase."
      : "Manage countries, logos, responsible contacts and associated dojos. Public records update from Supabase.",
    countries: es ? "Paises" : "Countries",
    importExistingCountries: es ? "Importar paises existentes" : "Import existing countries",
    importCountriesTitle: es ? "Importacion CSV de paises" : "Countries CSV import",
    importCountriesDescription: es
      ? "Pega o sube el CSV exportado desde Google Sheets para crear o actualizar paises en bloque. Solo super admin."
      : "Paste or upload the CSV exported from Google Sheets to create or update countries in bulk. Super admin only.",
    importCountriesButton: es ? "Importar paises" : "Import countries",
    importCountriesHelper: es
      ? "Columnas recomendadas: country_code, country_name, status, is_public, responsible_person, representative_entity, responsible_email, description_es."
      : "Recommended columns: country_code, country_name, status, is_public, responsible_person, representative_entity, responsible_email, description_es.",
    loadingCountries: es ? "Cargando paises..." : "Loading countries...",
    noCountries: es
      ? "Aun no hay paises en Supabase. Importa los existentes para empezar a editarlos."
      : "There are no countries in Supabase yet. Import the existing ones to start editing.",
    public: es ? "Publico" : "Public",
    hidden: es ? "Oculto" : "Hidden",
    pendingId: es ? "ID pendiente" : "Pending ID",
    edit: es ? "Editar" : "Edit",
    delete: es ? "Borrar" : "Delete",
    loadingDojos: es ? "Cargando dojos..." : "Loading dojos...",
    noDojos: es ? "Aun no hay dojos." : "There are no dojos yet.",
    editCountry: es ? "Editar pais" : "Edit country",
    newCountry: es ? "Nuevo pais" : "New country",
    selectCountry: es ? "Selecciona pais" : "Select country",
    selectCountryToEdit: es ? "Selecciona tu pais en la lista para editarlo." : "Select your country in the list to edit it.",
    language: es ? "Idioma" : "Language",
    status: es ? "Estado" : "Status",
    countryCode: es ? "Codigo pais" : "Country code",
    draft: es ? "Borrador" : "Draft",
    published: es ? "Publicado" : "Published",
    archived: es ? "Archivado" : "Archived",
    slug: "Slug",
    visibleOnPublicSite: es ? "Visible en la web publica" : "Visible on the public website",
    name: es ? "Nombre" : "Name",
    countryInfo: es ? "Informacion del pais" : "Country information",
    responsible: es ? "Responsable" : "Responsible person",
    representativeEntity: es
      ? "Entidad representante del pais"
      : "Country representative entity",
    responsibleEmail: es ? "Email responsable" : "Responsible email",
    countryFlag: es ? "Bandera del pais" : "Country flag",
    countryFlagHelp: es
      ? "Normalmente no hace falta subir nada: la web pone la bandera automaticamente segun el codigo del pais. Usa esta subida solo si necesitas sustituirla manualmente."
      : "Usually you do not need to upload anything: the website sets the flag automatically from the country code. Use this upload only if you need to replace it manually.",
    editDojo: es ? "Editar dojo" : "Edit dojo",
    newDojo: es ? "Nuevo dojo" : "New dojo",
    importDojosTitle: es ? "Importacion CSV de dojos" : "Dojos CSV import",
    importDojosDescription: es
      ? "Pega o sube el CSV exportado desde Google Sheets para crear o actualizar dojos del pais correspondiente."
      : "Paste or upload the CSV exported from Google Sheets to create or update dojos for the corresponding country.",
    importDojosButton: es ? "Importar dojos" : "Import dojos",
    importDojosHelper: es
      ? "Columnas recomendadas: country_code, dojo_name, city, address, responsible_instructor, email, phone, website, status, is_public, description_es."
      : "Recommended columns: country_code, dojo_name, city, address, responsible_instructor, email, phone, website, status, is_public, description_es.",
    dojos: "Dojos",
    country: es ? "Pais" : "Country",
    city: es ? "Ciudad" : "City",
    dojoName: es ? "Nombre dojo" : "Dojo name",
    dojoInfo: es ? "Informacion, horarios y notas" : "Information, schedule and notes",
    address: es ? "Direccion" : "Address",
    responsibleInstructor: es ? "Instructor responsable" : "Responsible instructor",
    instructorPhoto: es ? "Foto del responsable tecnico" : "Technical lead photo",
    instructorPhotoHelp: es
      ? "Foto del sensei o responsable tecnico que se mostrara en la ficha publica del dojo."
      : "Photo of the sensei or technical lead shown on the public dojo card.",
    phone: es ? "Telefono" : "Phone",
    email: "Email",
    website: es ? "Pagina web" : "Website",
    dojoLogo: es ? "Logo de kempo del dojo" : "Dojo kempo logo",
    dojoLogoHelp: es
      ? "Solo logo del club o dojo. No subir fotos generales del dojo ni imagenes de entrenamientos en este campo."
      : "Club or dojo logo only. Do not upload general dojo photos or training images in this field.",
    save: es ? "Guardar" : "Save",
    new: es ? "Nuevo" : "New",
    noImage: es ? "Sin imagen" : "No image",
    preview: es ? "Vista previa" : "Preview",
    changeImage: es ? "Cambiar imagen" : "Change image",
    uploadImage: es ? "Subir imagen" : "Upload image",
    removeImage: es ? "Quitar imagen" : "Remove image",
  };
}
