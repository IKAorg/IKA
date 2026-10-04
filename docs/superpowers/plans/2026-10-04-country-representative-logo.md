# Country Representative Logo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Drive-backed representative-entity logo to each country, discoverable from the entity website and replaceable by super admins or scoped country administrators.

**Architecture:** Store the confirmed logo as a dedicated `media_library` reference on `countries`, separate from the flag. A focused server module safely discovers remote logo candidates; an authenticated API imports the chosen candidate through the existing Google Drive image pipeline. The country editor owns preview/replace/remove state, while the public countries page only resolves and renders the confirmed media reference.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase/PostgreSQL, Google Drive media pipeline, Sharp, Node test runner, Tailwind CSS.

---

## File Map

- Create `supabase/migrations/202610040001_country_representative_logo.sql`: add the independent media foreign key.
- Create `lib/media/remote-logo-discovery.ts`: validate public URLs, fetch bounded HTML/images, parse and rank logo candidates.
- Create `lib/media/remote-logo-discovery.test.ts`: pure URL, parsing, ranking, and network-safety tests.
- Create `app/api/admin/locations/representative-logo/route.ts`: authenticated discovery and confirmed Drive import endpoint.
- Modify `app/api/admin/locations/route.ts`: read and save the representative logo reference with existing country scope checks.
- Modify `components/admin/locations-admin.tsx`: add website search, preview, manual replacement, removal, and translated states.
- Modify `lib/content/locations-cms.ts`: expose the confirmed representative logo to public country data.
- Modify `app/[locale]/countries/page.tsx`: render a stable logo thumbnail with the existing icon as fallback.

### Task 1: Add the representative logo data field

**Files:**
- Create: `supabase/migrations/202610040001_country_representative_logo.sql`
- Modify: `app/api/admin/locations/route.ts`
- Modify: `components/admin/locations-admin.tsx`

- [ ] **Step 1: Create the database migration**

```sql
alter table public.countries
  add column if not exists representative_logo_media_id uuid
  references public.media_library(id) on delete set null;

create index if not exists countries_representative_logo_media_idx
  on public.countries (representative_logo_media_id)
  where representative_logo_media_id is not null;
```

- [ ] **Step 2: Apply the migration to the linked Supabase project**

Run: `npx supabase db push`

Expected: `202610040001_country_representative_logo.sql` is applied successfully.

- [ ] **Step 3: Extend country API selections and media resolution**

Add `representative_logo_media_id` to the country row types and every country select in `app/api/admin/locations/route.ts`. Include it in the `mediaIds` set:

```ts
...countries.flatMap((country) => [
  country.flag_media_id,
  country.main_image_media_id,
  country.representative_logo_media_id,
]),
```

Extend `LocationBody.country`:

```ts
representativeLogoMediaId?: string | null;
representativeLogoMediaUrl?: string | null;
```

Resolve it in `saveCountry`:

```ts
representative_logo_media_id: await resolveMediaId(
  admin,
  input.representativeLogoMediaId ?? null,
  input.representativeLogoMediaUrl ?? null,
  `${name} representative entity logo`,
),
```

- [ ] **Step 4: Extend the country editor data model**

Add `representative_logo_media_id` to `CountryRow`, and add this field to `CountryForm` and `createEmptyCountryForm`:

```ts
representativeLogoUrl: string;
```

Hydrate it independently from the flag:

```ts
representativeLogoUrl: getMediaUrl(
  country.representative_logo_media_id,
  mediaById,
),
```

Send it in `saveCountry`:

```ts
representativeLogoMediaUrl: countryForm.representativeLogoUrl || null,
```

- [ ] **Step 5: Run type and build checks**

Run: `npm run typecheck && npm run build`

Expected: both commands exit successfully.

- [ ] **Step 6: Commit the schema and model changes**

```bash
git add supabase/migrations/202610040001_country_representative_logo.sql app/api/admin/locations/route.ts components/admin/locations-admin.tsx
git commit -m "Add representative entity logo field"
```

### Task 2: Build safe remote logo discovery

**Files:**
- Create: `lib/media/remote-logo-discovery.ts`
- Create: `lib/media/remote-logo-discovery.test.ts`

- [ ] **Step 1: Write failing tests for URL safety**

Use Node's test runner to cover public URLs and blocked destinations:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { assertPublicRemoteUrl } from "./remote-logo-discovery.ts";

test("accepts a public https website", async () => {
  await assert.doesNotReject(() => assertPublicRemoteUrl("https://example.com"));
});

for (const url of [
  "http://127.0.0.1/logo.png",
  "http://localhost/logo.png",
  "http://169.254.169.254/latest/meta-data",
  "http://10.0.0.2/logo.png",
  "file:///etc/passwd",
]) {
  test(`blocks ${url}`, async () => {
    await assert.rejects(() => assertPublicRemoteUrl(url));
  });
}
```

- [ ] **Step 2: Run the URL safety tests and confirm failure**

Run: `node --experimental-strip-types --test lib/media/remote-logo-discovery.test.ts`

Expected: FAIL because `remote-logo-discovery.ts` does not exist.

- [ ] **Step 3: Implement public URL validation**

Export `assertPublicRemoteUrl(value: string): Promise<URL>`. Require `http:` or `https:`, resolve every hostname with `dns.promises.lookup({ all: true })`, and reject loopback, link-local, private IPv4 ranges, IPv6 loopback, unique-local and IPv4-mapped private addresses. Do not accept embedded credentials.

- [ ] **Step 4: Add failing parsing and ranking tests**

Cover relative URL resolution and ordering:

```ts
import { extractLogoCandidates } from "./remote-logo-discovery.ts";

test("prefers declared logos over social images and icons", () => {
  const html = `
    <link rel="icon" sizes="32x32" href="/favicon.png">
    <meta property="og:image" content="/social.jpg">
    <link rel="logo" href="/brand.svg">
  `;
  assert.deepEqual(
    extractLogoCandidates(html, new URL("https://example.com/about"))
      .map((candidate) => candidate.url),
    [
      "https://example.com/brand.svg",
      "https://example.com/social.jpg",
      "https://example.com/favicon.png",
    ],
  );
});
```

- [ ] **Step 5: Implement bounded HTML discovery**

Export these interfaces and functions:

```ts
export type RemoteLogoCandidate = {
  url: string;
  source: "logo" | "og-image" | "apple-touch-icon" | "icon";
  label: string;
};

export function extractLogoCandidates(
  html: string,
  pageUrl: URL,
): RemoteLogoCandidate[];

export async function discoverRemoteLogos(
  website: string,
): Promise<RemoteLogoCandidate[]>;
```

Use a 10-second `AbortSignal.timeout`, a maximum of five redirects validated one by one, an HTML response limit of 2 MB, and a maximum of six unique candidates. Parse `link[rel~=logo]`, `meta[property=og:image]`, `link[rel=apple-touch-icon]`, and sized icons in that order. Ignore data URLs and malformed URLs.

- [ ] **Step 6: Add and pass tests for redirect and byte limits**

Inject or wrap `fetch` so the tests can return controlled responses. Assert that redirects to private hosts fail and HTML larger than 2 MB fails before parsing.

Run: `node --experimental-strip-types --test lib/media/remote-logo-discovery.test.ts`

Expected: all discovery tests PASS.

- [ ] **Step 7: Commit the discovery module**

```bash
git add lib/media/remote-logo-discovery.ts lib/media/remote-logo-discovery.test.ts
git commit -m "Add safe representative logo discovery"
```

### Task 3: Add authenticated discovery and Drive import API

**Files:**
- Create: `app/api/admin/locations/representative-logo/route.ts`
- Modify: `lib/media/remote-logo-discovery.ts`

- [ ] **Step 1: Add a bounded image download helper and tests**

Export:

```ts
export async function downloadRemoteImage(url: string): Promise<{
  buffer: Buffer;
  contentType: string;
  fileName: string;
}>;
```

Validate every redirect, require `image/jpeg`, `image/png`, `image/webp`, `image/gif`, or `image/svg+xml`, reject responses larger than 10 MB using both `content-length` and streamed bytes, and apply a 10-second timeout. Add tests for a valid image, HTML masquerading as an image, oversized content, and a private redirect.

- [ ] **Step 2: Run image download tests**

Run: `node --experimental-strip-types --test lib/media/remote-logo-discovery.test.ts`

Expected: all tests PASS.

- [ ] **Step 3: Implement the scoped API route**

The route accepts two actions:

```ts
type Body =
  | { action: "discover"; countryId: string; website: string }
  | { action: "import"; countryId: string; imageUrl: string };
```

Use `requireScopedAdmin(request)`. Load the country and allow access when the scope is global or `scope.countryIds.includes(countryId)`. For `discover`, return `discoverRemoteLogos(website)`. For `import`, download the selected image and call:

```ts
const uploaded = await uploadDriveImage({
  admin: guard.admin,
  input: image.buffer,
  originalName: image.fileName,
  category: "locations",
  visibility: "public",
  profileId: guard.scope.profileId,
  sourceKey: `country-representative:${countryId}:${createHash("sha256")
    .update(imageUrl)
    .digest("hex")}`,
  sourceUrl: imageUrl,
});
```

Return the Drive-backed `/api/media/public/...` URL. Do not update `countries` until the normal country form is saved.

- [ ] **Step 4: Add clear API errors**

Return 400 for invalid URL/input, 403 for out-of-scope country access, 404 for a missing country, 422 when no candidate exists, 502 for an inaccessible remote resource or Drive failure, and Spanish user-facing messages with stable `code` values.

- [ ] **Step 5: Run verification**

Run: `npm run typecheck && node --experimental-strip-types --test lib/media/remote-logo-discovery.test.ts`

Expected: all checks PASS.

- [ ] **Step 6: Commit the API**

```bash
git add app/api/admin/locations/representative-logo/route.ts lib/media/remote-logo-discovery.ts lib/media/remote-logo-discovery.test.ts
git commit -m "Add representative logo import API"
```

### Task 4: Add logo discovery and replacement controls

**Files:**
- Modify: `components/admin/locations-admin.tsx`

- [ ] **Step 1: Add editor state for discovery**

Add state scoped to the active country editor:

```ts
const [discoveringLogo, setDiscoveringLogo] = useState(false);
const [importingLogoUrl, setImportingLogoUrl] = useState("");
const [logoCandidates, setLogoCandidates] = useState<RemoteLogoCandidate[]>([]);
```

Clear candidates when switching country or changing the official website.

- [ ] **Step 2: Implement the discovery request**

Add `discoverRepresentativeLogos()` that requires a saved `countryForm.id` and a valid `responsibleWebsite`, sends auth headers to the new route, and stores returned candidates without changing `representativeLogoUrl`.

- [ ] **Step 3: Implement candidate confirmation**

Add `importRepresentativeLogo(candidate)` that calls the `import` action, waits for the Drive upload, then assigns the returned URL to `countryForm.representativeLogoUrl`. The country remains unsaved until the user presses the existing country save button.

- [ ] **Step 4: Build the representative logo editor block**

Place it after the representative website field. Reuse `ImageUploadField` for manual upload with scope `country-representative-logo`, plus:

```tsx
<button
  type="button"
  onClick={() => void discoverRepresentativeLogos()}
  disabled={!countryForm.id || !countryForm.responsibleWebsite || discoveringLogo}
  className="inline-flex items-center gap-2 border border-[var(--line)] px-3 py-2 text-sm font-semibold disabled:opacity-50"
>
  {discoveringLogo ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
  {copy.searchLogoOnWebsite}
</button>
```

Render candidates as fixed-size selectable previews with `object-contain`, source labels, and an `Use this logo` command. Keep manual upload and remove controls available in all states.

- [ ] **Step 5: Add all locale-facing copy**

Add Spanish and English fallback strings for the editor labels, loading state, candidate source, no-result message, import failure, manual upload helper, and overwrite explanation. Public labels need no new text.

- [ ] **Step 6: Verify editor behavior**

Run: `npm run typecheck && npm run build`

Expected: both commands PASS; a scoped country admin can edit their country logo, while a different country ID returns 403 from the API.

- [ ] **Step 7: Commit the editor**

```bash
git add components/admin/locations-admin.tsx
git commit -m "Add representative logo editor"
```

### Task 5: Render the logo on the public countries page

**Files:**
- Modify: `lib/content/locations-cms.ts`
- Modify: `app/[locale]/countries/page.tsx`

- [ ] **Step 1: Expose representative logo media publicly**

Add `representative_logo_media_id` to `CountryRow`, the Supabase select, and the media ID lookup. Extend `PublicCountry`:

```ts
representativeLogoUrl: string;
representativeLogoAlt: string;
```

Map values from `media_library`, using the media alt text or representative entity name.

- [ ] **Step 2: Replace the generic thumbnail when a logo exists**

Render:

```tsx
<span className="flex size-11 shrink-0 items-center justify-center border border-[var(--line)] bg-white p-1.5">
  {country.representativeLogoUrl ? (
    <Image
      src={country.representativeLogoUrl}
      alt={country.representativeLogoAlt}
      width={44}
      height={44}
      className="size-full object-contain"
    />
  ) : (
    <UserRound size={18} aria-hidden="true" />
  )}
</span>
```

Keep the thumbnail dimensions stable at every breakpoint so long entity names and the website button cannot shift the row layout.

- [ ] **Step 3: Verify all rendering states**

Check a country with a horizontal logo, a square logo, and no logo at desktop, mobile, tablet, and iPad Mini landscape widths. Confirm the official website button and open/close control remain aligned and non-overlapping.

- [ ] **Step 4: Run final local checks**

Run:

```bash
node --experimental-strip-types --test lib/media/remote-logo-discovery.test.ts
npm run typecheck
npm run build
git diff --check
```

Expected: tests, typecheck, build, and whitespace check all PASS.

- [ ] **Step 5: Commit public rendering**

```bash
git add lib/content/locations-cms.ts 'app/[locale]/countries/page.tsx'
git commit -m "Show representative logos on country cards"
```

### Task 6: Production deployment and smoke verification

**Files:**
- No source files expected unless verification reveals a defect.

- [ ] **Step 1: Confirm the working tree contains no unrelated staged files**

Run: `git status --short`

Expected: the existing untracked `IKA_System_Overview_for_Directors.docx` remains untouched and no unrelated file is staged.

- [ ] **Step 2: Push the completed commits**

Run: `git push origin main`

Expected: GitHub accepts the new commits.

- [ ] **Step 3: Wait for the production deployment**

Open the Vercel deployment for the final commit and wait until its state is `Ready` and environment is `Production`.

- [ ] **Step 4: Verify production permissions and UI**

In production:

1. As super admin, discover, select, save, replace manually, and remove a representative logo.
2. As the responsible country account, repeat the operations for its own country.
3. Confirm an out-of-scope country cannot be modified.
4. Confirm the public country row shows the saved logo and falls back to the generic icon after removal.
5. Confirm the image URL is served through `/api/media/public/` and the Drive asset is recorded.

- [ ] **Step 5: Record the final deployment commit**

Run: `git log -1 --oneline`

Expected: the final production commit identifies the representative logo feature.
