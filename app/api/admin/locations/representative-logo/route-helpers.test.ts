import assert from "node:assert/strict";
import test from "node:test";

// Node's type-stripping runner requires the source extension; the app tsconfig does not enable it.
// @ts-expect-error TS5097
import { canManageRepresentativeLogo, completeRepresentativeLogoImport, toRepresentativeLogoAsset } from "./route-helpers.ts";

const countryId = "country-1";
const baseScope = {
  isSuperAdmin: false,
  isGlobalAdmin: false,
  roleKeys: [] as string[],
  countryIds: [] as string[],
};

test("canManageRepresentativeLogo allows global admins and explicit matching country admins", () => {
  assert.equal(canManageRepresentativeLogo({ ...baseScope, isSuperAdmin: true }, countryId), true);
  assert.equal(canManageRepresentativeLogo({ ...baseScope, isGlobalAdmin: true }, countryId), true);
  assert.equal(canManageRepresentativeLogo({
    ...baseScope,
    roleKeys: ["country_admin"],
    countryIds: [countryId],
  }, countryId), true);
});

test("canManageRepresentativeLogo denies nonmatching country admins and dojo-only inferred countries", () => {
  assert.equal(canManageRepresentativeLogo({
    ...baseScope,
    roleKeys: ["country_admin"],
    countryIds: ["country-2"],
  }, countryId), false);
  assert.equal(canManageRepresentativeLogo({
    ...baseScope,
    roleKeys: ["dojo_admin"],
    countryIds: [countryId],
  }, countryId), false);
});

const storedAsset = {
  id: "asset-1",
  file_name: "logo-123.webp",
  mime_type: "image/webp",
  byte_size: 321,
  width: 100,
  height: 80,
  migration_status: "verified",
};

test("toRepresentativeLogoAsset returns the stable public asset shape", () => {
  assert.deepEqual(toRepresentativeLogoAsset(storedAsset), {
    id: "asset-1",
    url: "/api/media/public/asset-1",
    fileName: "logo-123.webp",
    mimeType: "image/webp",
    byteSize: 321,
    width: 100,
    height: 80,
  });
});

test("completeRepresentativeLogoImport returns the stored just-uploaded asset", async () => {
  const result = await completeRepresentativeLogoImport({
    upload: async () => ({ assetId: "asset-1" }),
    findById: async (assetId) => {
      assert.equal(assetId, "asset-1");
      return { data: storedAsset, error: null };
    },
    findBySourceKey: async () => assert.fail("race lookup must not run"),
  });

  assert.deepEqual(result, { asset: toRepresentativeLogoAsset(storedAsset), reused: false });
});

test("completeRepresentativeLogoImport recovers a verified winner after a unique conflict", async () => {
  const result = await completeRepresentativeLogoImport({
    upload: async () => { throw { code: "23505", message: "duplicate key" }; },
    findById: async () => assert.fail("uploaded lookup must not run"),
    findBySourceKey: async () => ({ data: storedAsset, error: null }),
  });

  assert.deepEqual(result, { asset: toRepresentativeLogoAsset(storedAsset), reused: true });
});

test("completeRepresentativeLogoImport preserves non-unique failures and winner lookup errors", async () => {
  const driveFailure = new Error("Drive unavailable");
  await assert.rejects(() => completeRepresentativeLogoImport({
    upload: async () => { throw driveFailure; },
    findById: async () => assert.fail("lookup must not run"),
    findBySourceKey: async () => assert.fail("race lookup must not run"),
  }), (error) => error === driveFailure);

  const lookupFailure = new Error("database unavailable");
  await assert.rejects(() => completeRepresentativeLogoImport({
    upload: async () => { throw { code: "23505" }; },
    findById: async () => assert.fail("lookup must not run"),
    findBySourceKey: async () => ({ data: null, error: lookupFailure }),
  }), (error) => error === lookupFailure);
});
