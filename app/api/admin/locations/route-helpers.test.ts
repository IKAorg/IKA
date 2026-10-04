import assert from "node:assert/strict";
import test from "node:test";

// Node's type-stripping runner requires the source extension; the app tsconfig does not enable it.
// @ts-expect-error TS5097
import { applyRepresentativeLogoToCountryPayload, canManageCountryRepresentativeLogo, getRepresentativeLogoMutation } from "./route-helpers.ts";

const countryId = "country-1";

test("limits representative logo changes to global or direct country admins", () => {
  assert.equal(
    canManageCountryRepresentativeLogo(
      { isGlobal: true, countryAdminIds: [] },
      countryId,
    ),
    true,
  );
  assert.equal(
    canManageCountryRepresentativeLogo(
      { isGlobal: false, countryAdminIds: [countryId] },
      countryId,
    ),
    true,
  );
  assert.equal(
    canManageCountryRepresentativeLogo(
      { isGlobal: false, countryAdminIds: [], countryIds: [countryId] },
      countryId,
    ),
    false,
  );
});

test("preserves the representative logo when legacy country saves omit both logo fields", () => {
  assert.deepEqual(
    getRepresentativeLogoMutation({}, true),
    { action: "preserve" },
  );
});

test("allows a direct country admin to replace the representative logo", () => {
  assert.deepEqual(
    getRepresentativeLogoMutation(
      { representativeLogoMediaId: "media-2" },
      true,
    ),
    {
      action: "resolve",
      mediaId: "media-2",
      mediaUrl: undefined,
    },
  );
});

test("allows an authorized admin to explicitly clear the representative logo", () => {
  assert.deepEqual(
    getRepresentativeLogoMutation(
      { representativeLogoMediaId: null, representativeLogoMediaUrl: "" },
      true,
    ),
    {
      action: "resolve",
      mediaId: null,
      mediaUrl: "",
    },
  );
});

test("preserves the representative logo when a dojo-only admin tries to replace or clear it", () => {
  assert.deepEqual(
    getRepresentativeLogoMutation(
      { representativeLogoMediaId: "media-2" },
      false,
    ),
    { action: "preserve" },
  );
  assert.deepEqual(
    getRepresentativeLogoMutation(
      { representativeLogoMediaId: null, representativeLogoMediaUrl: "" },
      false,
    ),
    { action: "preserve" },
  );
});

const basePayload = { code: "ES", representative_entity: "SKBC Gipuzkoa" };
const dojoOnlyScope = {
  isGlobal: false,
  countryAdminIds: [] as string[],
  countryIds: [countryId],
};
const directCountryScope = {
  isGlobal: false,
  countryAdminIds: [countryId],
  countryIds: [countryId],
};
const globalScope = {
  isGlobal: true,
  countryAdminIds: [] as string[],
  countryIds: [] as string[],
};

test("country save payload omits logo column for dojo-only replacement and clearing", async () => {
  const resolveCalls: unknown[][] = [];
  const resolveMediaId = async (...args: unknown[]) => {
    resolveCalls.push(args);
    return "resolved-media";
  };

  const replacement = await applyRepresentativeLogoToCountryPayload(
    basePayload,
    { representativeLogoMediaId: "media-2" },
    dojoOnlyScope,
    countryId,
    resolveMediaId,
  );
  const clearing = await applyRepresentativeLogoToCountryPayload(
    basePayload,
    { representativeLogoMediaId: null, representativeLogoMediaUrl: "" },
    dojoOnlyScope,
    countryId,
    resolveMediaId,
  );

  assert.equal("representative_logo_media_id" in replacement, false);
  assert.equal("representative_logo_media_id" in clearing, false);
  assert.deepEqual(resolveCalls, []);
});

test("country save payload includes resolved logo for direct country and global admins", async () => {
  for (const [actor, scope] of [
    ["direct-country", directCountryScope],
    ["global", globalScope],
  ] as const) {
    const payload = await applyRepresentativeLogoToCountryPayload(
      basePayload,
      { representativeLogoMediaId: `${actor}-media` },
      scope,
      countryId,
      async (mediaId, mediaUrl) => {
        assert.equal(mediaId, `${actor}-media`);
        assert.equal(mediaUrl, undefined);
        return `${actor}-resolved`;
      },
    );

    assert.equal(payload.representative_logo_media_id, `${actor}-resolved`);
  }
});

test("country save payload omits logo column when fields are omitted", async () => {
  const payload = await applyRepresentativeLogoToCountryPayload(
    basePayload,
    {},
    directCountryScope,
    countryId,
    async () => assert.fail("omitted fields must not resolve media"),
  );

  assert.equal("representative_logo_media_id" in payload, false);
});

test("country save payload includes null for an authorized explicit clear", async () => {
  const payload = await applyRepresentativeLogoToCountryPayload(
    basePayload,
    { representativeLogoMediaId: null, representativeLogoMediaUrl: "" },
    directCountryScope,
    countryId,
    async (mediaId, mediaUrl) => {
      assert.equal(mediaId, null);
      assert.equal(mediaUrl, "");
      return null;
    },
  );

  assert.equal("representative_logo_media_id" in payload, true);
  assert.equal(payload.representative_logo_media_id, null);
});
