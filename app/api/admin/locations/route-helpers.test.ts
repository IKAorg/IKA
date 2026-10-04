import assert from "node:assert/strict";
import test from "node:test";

// Node's type-stripping runner requires the source extension; the app tsconfig does not enable it.
// @ts-expect-error TS5097
import { canManageCountryRepresentativeLogo, getRepresentativeLogoMutation } from "./route-helpers.ts";

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
