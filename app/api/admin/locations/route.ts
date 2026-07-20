import { NextResponse, type NextRequest } from "next/server";
import {
  requireScopedAdmin,
  type AdminScope as RequestFormsAdminScope,
  type SupabaseAdminClient,
} from "@/lib/admin/request-forms";

type LocationScope = {
  isGlobal: boolean;
  countryIds: string[];
  dojoIds: string[];
  roleKeys: string[];
};

type LocationBody = {
  action?:
    | "save_country"
    | "save_dojo"
    | "delete_country"
    | "delete_dojo"
    | "import_countries_csv"
    | "import_dojos_csv";
  countryId?: string;
  dojoId?: string;
  csv?: string;
  country?: {
    id?: string;
    locale?: string;
    code?: string;
    status?: string;
    isPublic?: boolean;
    name?: string;
    slug?: string;
    description?: string;
    responsiblePerson?: string;
    representativeEntity?: string;
    responsibleEmail?: string;
    flagMediaId?: string | null;
    flagMediaUrl?: string | null;
  };
  dojo?: {
    id?: string;
    locale?: string;
    countryId?: string;
    status?: string;
    isPublic?: boolean;
    name?: string;
    slug?: string;
    description?: string;
    city?: string;
    address?: string;
    responsibleInstructor?: string;
    responsibleInstructorMediaId?: string | null;
    responsibleInstructorMediaUrl?: string | null;
    email?: string;
    phone?: string;
    website?: string;
    mainImageMediaId?: string | null;
    mainImageMediaUrl?: string | null;
  };
};

export async function GET(request: NextRequest) {
  const guard = await requireLocationsAdmin(request);

  if (guard.error) {
    return guard.error;
  }

  const [countriesResult, dojosResult] = await Promise.all([
    guard.admin
      .from("countries")
      .select(
        "id,code,ika_country_id,status,is_public,responsible_person,representative_entity,responsible_email,flag_media_id,main_image_media_id,country_translations(language_code,name,slug,description)",
      )
      .order("code", { ascending: true }),
    guard.admin
      .from("dojos")
      .select(
        "id,country_id,ika_dojo_id,city,address,responsible_instructor,responsible_instructor_media_id,email,phone,website,status,is_public,main_image_media_id,dojo_translations(language_code,name,slug,description)",
      )
      .order("city", { ascending: true }),
  ]);

  const firstError = countriesResult.error ?? dojosResult.error;

  if (firstError) {
    return NextResponse.json({ error: firstError.message }, { status: 500 });
  }

  const allDojos = (dojosResult.data ?? []) as Array<{
    id: string;
    country_id: string;
    main_image_media_id: string | null;
    responsible_instructor_media_id: string | null;
  }>;
  const dojos = scopeDojos(allDojos, guard.scope);
  const countries = scopeCountries(
    (countriesResult.data ?? []) as Array<{
      id: string;
      flag_media_id: string | null;
      main_image_media_id: string | null;
      representative_entity: string | null;
    }>,
    guard.scope,
    dojos,
  );
  const mediaIds = Array.from(
    new Set(
      [
        ...countries.flatMap((country) => [
          country.flag_media_id,
          country.main_image_media_id,
        ]),
        ...dojos.flatMap((dojo) => [
          dojo.main_image_media_id,
          dojo.responsible_instructor_media_id,
        ]),
      ].filter(Boolean) as string[],
    ),
  );
  const media = mediaIds.length
    ? await guard.admin
        .from("media_library")
        .select("id,storage_path,alt_text")
        .in("id", mediaIds)
    : { data: [], error: null };

  if (media.error) {
    return NextResponse.json({ error: media.error.message }, { status: 500 });
  }

  return NextResponse.json({
    countries,
    dojos,
    media: media.data ?? [],
    scope: guard.scope,
  });
}

export async function POST(request: NextRequest) {
  const guard = await requireLocationsAdmin(request);

  if (guard.error) {
    return guard.error;
  }

  const body = (await request.json().catch(() => null)) as LocationBody | null;

  if (body?.action === "save_country") {
    return saveCountry(guard.admin, guard.scope, body.country ?? {});
  }

  if (body?.action === "save_dojo") {
    return saveDojo(guard.admin, guard.scope, body.dojo ?? {});
  }

  if (body?.action === "delete_country") {
    return deleteCountry(guard.admin, guard.scope, body.countryId ?? "");
  }

  if (body?.action === "delete_dojo") {
    return deleteDojo(guard.admin, guard.scope, body.dojoId ?? "");
  }

  if (body?.action === "import_countries_csv") {
    return importCountriesCsv(guard.admin, guard.scope, body.csv ?? "");
  }

  if (body?.action === "import_dojos_csv") {
    return importDojosCsv(guard.admin, guard.scope, body.csv ?? "");
  }

  return NextResponse.json({ error: "Accion no valida." }, { status: 400 });
}

async function importCountriesCsv(
  admin: SupabaseAdminClient,
  scope: LocationScope,
  csv: string,
) {
  if (!hasSuperAdminRole(scope)) {
    return NextResponse.json(
      { error: "Solo super admin puede importar paises." },
      { status: 403 },
    );
  }

  const rows = parseLocationCsv(csv);

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "El CSV de paises no contiene filas validas." },
      { status: 400 },
    );
  }

  let imported = 0;
  let updated = 0;
  let skipped = 0;
  const errors: Array<{ row: number; error: string }> = [];

  for (const row of rows) {
    const code = getRowValue(row.record, ["country_code", "code"]).toUpperCase();
    const name = getRowValue(row.record, ["country_name", "name", "pais", "country"]);
    const status = normalizeStatus(
      getRowValue(row.record, ["status", "estado"]) || "published",
    );
    const isPublic = normalizeYesNo(
      getRowValue(row.record, ["is_public", "publico", "public"]),
      true,
    );
    const responsiblePerson = getRowValue(row.record, [
      "responsible_person",
      "responsable",
      "representative",
    ]);
    const representativeEntity = getRowValue(row.record, [
      "representative_entity",
      "entidad_representante",
      "entity",
    ]);
    const responsibleEmail = getRowValue(row.record, [
      "responsible_email",
      "email_responsable",
      "email",
    ]);
    const description = getRowValue(row.record, [
      "description_es",
      "description",
      "descripcion",
    ]);

    if (!code || !name) {
      skipped += 1;
      errors.push({
        row: row.rowNumber,
        error: "Codigo y nombre de pais son obligatorios.",
      });
      continue;
    }

    const existing = await admin
      .from("countries")
      .select("id")
      .eq("code", code)
      .maybeSingle<{ id: string }>();

    if (existing.error) {
      skipped += 1;
      errors.push({ row: row.rowNumber, error: existing.error.message });
      continue;
    }

    const payload = {
      code,
      status,
      is_public: isPublic,
      responsible_person: responsiblePerson || null,
      representative_entity: representativeEntity || null,
      responsible_email: responsibleEmail || null,
    };

    const country = existing.data
      ? await admin
          .from("countries")
          .update(payload)
          .eq("id", existing.data.id)
          .select("id")
          .single<{ id: string }>()
      : await admin
          .from("countries")
          .insert(payload)
          .select("id")
          .single<{ id: string }>();

    if (country.error || !country.data) {
      skipped += 1;
      errors.push({
        row: row.rowNumber,
        error: country.error?.message ?? "No se pudo guardar el pais.",
      });
      continue;
    }

    const translation = await admin.from("country_translations").upsert(
      {
        country_id: country.data.id,
        language_code: "es",
        name,
        slug: slugify(name),
        description: description || null,
      },
      { onConflict: "country_id,language_code" },
    );

    if (translation.error) {
      skipped += 1;
      errors.push({ row: row.rowNumber, error: translation.error.message });
      continue;
    }

    if (existing.data) {
      updated += 1;
    } else {
      imported += 1;
    }
  }

  return NextResponse.json({ imported, updated, skipped, errors });
}

async function importDojosCsv(
  admin: SupabaseAdminClient,
  scope: LocationScope,
  csv: string,
) {
  const rows = parseLocationCsv(csv);

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "El CSV de dojos no contiene filas validas." },
      { status: 400 },
    );
  }

  let imported = 0;
  let updated = 0;
  let skipped = 0;
  const errors: Array<{ row: number; error: string }> = [];

  for (const row of rows) {
    const countryCode = getRowValue(row.record, [
      "country_code",
      "codigo_pais",
      "code",
    ]).toUpperCase();
    const name = getRowValue(row.record, [
      "dojo_name",
      "name",
      "dojo",
      "club",
    ]);
    const city = getRowValue(row.record, ["city", "ciudad"]);
    const address = getRowValue(row.record, ["address", "direccion"]);
    const responsibleInstructor = getRowValue(row.record, [
      "responsible_instructor",
      "instructor",
      "sensei",
    ]);
    const email = getRowValue(row.record, ["email"]);
    const phone = getRowValue(row.record, ["phone", "telefono"]);
    const website = getRowValue(row.record, ["website", "web"]);
    const status = normalizeStatus(
      getRowValue(row.record, ["status", "estado"]) || "published",
    );
    const isPublic = normalizeYesNo(
      getRowValue(row.record, ["is_public", "publico", "public"]),
      true,
    );
    const description = getRowValue(row.record, [
      "description_es",
      "description",
      "descripcion",
    ]);

    if (!countryCode || !name || !city) {
      skipped += 1;
      errors.push({
        row: row.rowNumber,
        error: "Pais, nombre de dojo y ciudad son obligatorios.",
      });
      continue;
    }

    const country = await admin
      .from("countries")
      .select("id")
      .eq("code", countryCode)
      .maybeSingle<{ id: string }>();

    if (country.error || !country.data) {
      skipped += 1;
      errors.push({
        row: row.rowNumber,
        error: `No existe el pais ${countryCode} en IKA.`,
      });
      continue;
    }

    if (!canManageCountry(scope, country.data.id)) {
      skipped += 1;
      errors.push({
        row: row.rowNumber,
        error: "No tienes permisos para ese pais.",
      });
      continue;
    }

    const existing = await admin
      .from("dojos")
      .select("id")
      .eq("country_id", country.data.id)
      .ilike("city", city)
      .maybeSingle<{ id: string }>();

    if (existing.error) {
      skipped += 1;
      errors.push({ row: row.rowNumber, error: existing.error.message });
      continue;
    }

    const payload = {
      country_id: country.data.id,
      city,
      address: address || null,
      responsible_instructor: responsibleInstructor || null,
      email: email || null,
      phone: phone || null,
      website: website || null,
      status,
      is_public: isPublic,
    };

    const dojo = existing.data
      ? await admin
          .from("dojos")
          .update(payload)
          .eq("id", existing.data.id)
          .select("id")
          .single<{ id: string }>()
      : await admin
          .from("dojos")
          .insert(payload)
          .select("id")
          .single<{ id: string }>();

    if (dojo.error || !dojo.data) {
      skipped += 1;
      errors.push({
        row: row.rowNumber,
        error: dojo.error?.message ?? "No se pudo guardar el dojo.",
      });
      continue;
    }

    const translation = await admin.from("dojo_translations").upsert(
      {
        dojo_id: dojo.data.id,
        language_code: "es",
        name,
        slug: slugify(name),
        description: description || null,
      },
      { onConflict: "dojo_id,language_code" },
    );

    if (translation.error) {
      skipped += 1;
      errors.push({ row: row.rowNumber, error: translation.error.message });
      continue;
    }

    if (existing.data) {
      updated += 1;
    } else {
      imported += 1;
    }
  }

  return NextResponse.json({ imported, updated, skipped, errors });
}

async function saveCountry(
  admin: SupabaseAdminClient,
  scope: LocationScope,
  input: NonNullable<LocationBody["country"]>,
) {
  if (!hasSuperAdminRole(scope)) {
    return NextResponse.json(
      { error: "Solo super admin puede crear o editar paises." },
      { status: 403 },
    );
  }

  const countryId = normalizeText(input.id);

  const code = normalizeText(input.code).toUpperCase();
  const name = normalizeText(input.name);
  const locale = normalizeText(input.locale) || "es";

  if (!code || !name) {
    return NextResponse.json(
      { error: "Codigo y nombre de pais son obligatorios." },
      { status: 400 },
    );
  }

  const payload = {
    code,
    status: normalizeStatus(input.status),
    is_public: input.isPublic !== false,
    responsible_person: normalizeText(input.responsiblePerson) || null,
    representative_entity: normalizeText(input.representativeEntity) || null,
    responsible_email: normalizeText(input.responsibleEmail) || null,
    flag_media_id: await resolveMediaId(
      admin,
      input.flagMediaId ?? null,
      input.flagMediaUrl ?? null,
      `${name} flag`,
    ),
    main_image_media_id: null,
  };
  const country = countryId
    ? await admin
        .from("countries")
        .update(payload)
        .eq("id", countryId)
        .select("id")
        .single<{ id: string }>()
    : await admin
        .from("countries")
        .insert(payload)
        .select("id")
        .single<{ id: string }>();

  if (country.error || !country.data) {
    return NextResponse.json(
      { error: country.error?.message ?? "No se pudo guardar el pais." },
      { status: 500 },
    );
  }

  const translation = await admin.from("country_translations").upsert(
    {
      country_id: country.data.id,
      language_code: locale,
      name,
      slug: normalizeText(input.slug) || slugify(name),
      description: normalizeText(input.description) || null,
    },
    { onConflict: "country_id,language_code" },
  );

  if (translation.error) {
    return NextResponse.json({ error: translation.error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

async function saveDojo(
  admin: SupabaseAdminClient,
  scope: LocationScope,
  input: NonNullable<LocationBody["dojo"]>,
) {
  const countryId = normalizeText(input.countryId);
  const city = normalizeText(input.city);
  const name = normalizeText(input.name);
  const locale = normalizeText(input.locale) || "es";

  if (!countryId || !city || !name) {
    return NextResponse.json(
      { error: "Pais, ciudad y nombre de dojo son obligatorios." },
      { status: 400 },
    );
  }

  if (!canManageCountry(scope, countryId)) {
    return NextResponse.json(
      { error: "No puedes modificar dojos de ese pais." },
      { status: 403 },
    );
  }

  if (
    input.id &&
    !scope.isGlobal &&
    !scope.countryIds.includes(countryId) &&
    scope.dojoIds.length > 0 &&
    !scope.dojoIds.includes(input.id)
  ) {
    return NextResponse.json(
      { error: "No puedes modificar ese dojo." },
      { status: 403 },
    );
  }

  const payload = {
    country_id: countryId,
    city,
    address: normalizeText(input.address) || null,
    responsible_instructor: normalizeText(input.responsibleInstructor) || null,
    responsible_instructor_media_id: await resolveMediaId(
      admin,
      input.responsibleInstructorMediaId ?? null,
      input.responsibleInstructorMediaUrl ?? null,
      `${normalizeText(input.responsibleInstructor) || name} instructor`,
    ),
    email: normalizeText(input.email) || null,
    phone: normalizeText(input.phone) || null,
    website: normalizeText(input.website) || null,
    status: normalizeStatus(input.status),
    is_public: input.isPublic !== false,
    main_image_media_id: await resolveMediaId(
      admin,
      input.mainImageMediaId ?? null,
      input.mainImageMediaUrl ?? null,
      name,
    ),
  };
  const dojo = input.id
    ? await admin
        .from("dojos")
        .update(payload)
        .eq("id", input.id)
        .select("id")
        .single<{ id: string }>()
    : await admin
        .from("dojos")
        .insert(payload)
        .select("id")
        .single<{ id: string }>();

  if (dojo.error || !dojo.data) {
    return NextResponse.json(
      { error: dojo.error?.message ?? "No se pudo guardar el dojo." },
      { status: 500 },
    );
  }

  const translation = await admin.from("dojo_translations").upsert(
    {
      dojo_id: dojo.data.id,
      language_code: locale,
      name,
      slug: normalizeText(input.slug) || slugify(name),
      description: normalizeText(input.description) || null,
    },
    { onConflict: "dojo_id,language_code" },
  );

  if (translation.error) {
    return NextResponse.json({ error: translation.error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

async function deleteCountry(
  admin: SupabaseAdminClient,
  scope: LocationScope,
  countryId: string,
) {
  if (!hasSuperAdminRole(scope)) {
    return NextResponse.json(
      { error: "Solo super admin puede borrar paises." },
      { status: 403 },
    );
  }

  const deleted = await admin.from("countries").delete().eq("id", countryId);

  if (deleted.error) {
    return NextResponse.json({ error: deleted.error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

async function deleteDojo(
  admin: SupabaseAdminClient,
  scope: LocationScope,
  dojoId: string,
) {
  const dojo = await admin
    .from("dojos")
    .select("id,country_id")
    .eq("id", dojoId)
    .single<{ id: string; country_id: string }>();

  if (dojo.error || !dojo.data) {
    return NextResponse.json(
      { error: dojo.error?.message ?? "No se encontro el dojo." },
      { status: 404 },
    );
  }

  if (
    !scope.isGlobal &&
    !scope.countryIds.includes(dojo.data.country_id) &&
    !scope.dojoIds.includes(dojo.data.id)
  ) {
    return NextResponse.json(
      { error: "No puedes borrar ese dojo." },
      { status: 403 },
    );
  }

  const deleted = await admin.from("dojos").delete().eq("id", dojoId);

  if (deleted.error) {
    return NextResponse.json({ error: deleted.error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

async function requireLocationsAdmin(request: NextRequest) {
  const guard = await requireScopedAdmin(request);
  if ("error" in guard) {
    const message =
      guard.status === 403 &&
      guard.error === "No se encontro un perfil administrador para esta sesion."
        ? "No se encontro el perfil del administrador."
        : guard.error;
    return {
      error: NextResponse.json({ error: message }, { status: guard.status }),
    } as const;
  }

  return {
    admin: guard.admin,
    profileId: guard.scope.profileId,
    scope: mapScope(guard.scope),
  } as const;
}

function scopeCountries<T extends { id: string }, D extends { country_id: string }>(
  countries: T[],
  scope: LocationScope,
  dojos: D[],
) {
  if (scope.isGlobal) {
    return countries;
  }

  const countryIds = new Set([
    ...scope.countryIds,
    ...dojos.map((dojo) => dojo.country_id),
  ]);

  return countries.filter((country) => countryIds.has(country.id));
}

function scopeDojos<T extends { id: string; country_id: string }>(
  dojos: T[],
  scope: LocationScope,
) {
  if (scope.isGlobal) {
    return dojos;
  }

  return dojos.filter(
    (dojo) =>
      scope.countryIds.includes(dojo.country_id) ||
      scope.dojoIds.includes(dojo.id),
  );
}

function canManageCountry(scope: LocationScope, countryId: string) {
  return scope.isGlobal || scope.countryIds.includes(countryId);
}

function hasSuperAdminRole(scope: LocationScope) {
  return scope.roleKeys.includes("super_admin");
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeStatus(value: unknown) {
  const status = normalizeText(value);
  return ["draft", "published", "archived"].includes(status)
    ? status
    : "published";
}

async function resolveMediaId(
  admin: SupabaseAdminClient,
  mediaId: string | null | undefined,
  mediaUrl: string | null | undefined,
  title: string,
) {
  const normalizedId = normalizeText(mediaId);

  if (normalizedId) {
    return normalizedId;
  }

  const url = normalizeText(mediaUrl);

  if (!url) {
    return null;
  }

  const media = await admin
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
    .single<{ id: string }>();

  return media.data?.id ?? null;
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

function normalizeHeader(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function detectCsvDelimiter(headerLine: string) {
  const candidates = [",", ";", "\t"];
  let best = ",";
  let bestCount = -1;

  for (const candidate of candidates) {
    const count = headerLine.split(candidate).length;
    if (count > bestCount) {
      best = candidate;
      bestCount = count;
    }
  }

  return best;
}

function splitCsvLine(line: string, delimiter: string) {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function parseLocationCsv(csv: string) {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return [] as Array<{
      rowNumber: number;
      record: Map<string, string>;
    }>;
  }

  const delimiter = detectCsvDelimiter(lines[0]);
  const headers = splitCsvLine(lines[0], delimiter).map((header) =>
    normalizeHeader(header),
  );

  return lines.slice(1).map((line, index) => {
    const values = splitCsvLine(line, delimiter);
    return {
      rowNumber: index + 2,
      record: new Map(headers.map((header, valueIndex) => [header, values[valueIndex] ?? ""])),
    };
  });
}

function getRowValue(record: Map<string, string>, headers: string[]) {
  for (const header of headers) {
    const value = record.get(header);
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function normalizeYesNo(value: string, fallback = true) {
  const normalized = normalizeText(value).toLowerCase();

  if (!normalized) {
    return fallback;
  }

  if (["yes", "si", "true", "1", "public", "published"].includes(normalized)) {
    return true;
  }

  if (["no", "false", "0", "hidden", "private"].includes(normalized)) {
    return false;
  }

  return fallback;
}

function mapScope(scope: RequestFormsAdminScope): LocationScope {
  return {
    isGlobal: scope.isSuperAdmin || scope.isGlobalAdmin,
    countryIds: scope.countryIds,
    dojoIds: scope.dojoIds,
    roleKeys: scope.roleKeys,
  };
}
