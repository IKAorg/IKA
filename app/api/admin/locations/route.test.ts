import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server.js";

// Node's type-stripping runner requires the source extension; the app tsconfig does not enable it.
// @ts-expect-error TS5097
import { POST, setRequireScopedAdminForLocationsTests } from "./route.ts";

const countryId = "country-1";

type TestScope = {
  isSuperAdmin: boolean;
  isGlobalAdmin: boolean;
  countryAdminIds: string[];
  countryIds: string[];
  dojoIds: string[];
  roleKeys: string[];
};

function createAdminCapture() {
  let countryUpdatePayload: Record<string, unknown> | null = null;

  const admin = {
    from(table: string) {
      if (table === "countries") {
        return {
          update(payload: Record<string, unknown>) {
            countryUpdatePayload = payload;
            return {
              eq() {
                return {
                  select() {
                    return {
                      async single() {
                        return { data: { id: countryId }, error: null };
                      },
                    };
                  },
                };
              },
            };
          },
        };
      }

      if (table === "country_translations") {
        return {
          async upsert() {
            return { data: null, error: null };
          },
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  };

  return {
    admin,
    getPayload() {
      assert.ok(countryUpdatePayload, "countries.update(payload) was not called");
      return countryUpdatePayload;
    },
  };
}

async function invokeCountrySave(
  scope: TestScope,
  logoInput: Record<string, unknown>,
) {
  const capture = createAdminCapture();
  setRequireScopedAdminForLocationsTests(async () => ({
    admin: capture.admin as never,
    scope: {
      profileId: "profile-1",
      roleProfileIds: ["profile-1"],
      director: null,
      ...scope,
    },
  }));

  try {
    const request = new NextRequest("http://localhost/api/admin/locations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "save_country",
        country: {
          id: countryId,
          locale: "es",
          code: "ES",
          name: "España",
          flagMediaId: "flag-1",
          ...logoInput,
        },
      }),
    });
    const response = await POST(request);
    assert.equal(response.status, 200);
    return capture.getPayload();
  } finally {
    setRequireScopedAdminForLocationsTests(null);
  }
}

const dojoOnlyScope: TestScope = {
  isSuperAdmin: false,
  isGlobalAdmin: false,
  countryAdminIds: [],
  countryIds: [countryId],
  dojoIds: ["dojo-1"],
  roleKeys: ["dojo_admin"],
};

const directCountryScope: TestScope = {
  isSuperAdmin: false,
  isGlobalAdmin: false,
  countryAdminIds: [countryId],
  countryIds: [countryId],
  dojoIds: [],
  roleKeys: ["country_admin"],
};

const globalScope: TestScope = {
  isSuperAdmin: false,
  isGlobalAdmin: true,
  countryAdminIds: [],
  countryIds: [],
  dojoIds: [],
  roleKeys: ["global_admin"],
};

test("POST omits representative logo for dojo-only replacement and clear", async () => {
  const replacement = await invokeCountrySave(dojoOnlyScope, {
    representativeLogoMediaId: "replacement-1",
  });
  const clearing = await invokeCountrySave(dojoOnlyScope, {
    representativeLogoMediaId: null,
    representativeLogoMediaUrl: "",
  });

  assert.equal("representative_logo_media_id" in replacement, false);
  assert.equal("representative_logo_media_id" in clearing, false);
});

test("POST includes representative logo replacement for direct-country and global admins", async () => {
  const direct = await invokeCountrySave(directCountryScope, {
    representativeLogoMediaId: "direct-logo",
  });
  const global = await invokeCountrySave(globalScope, {
    representativeLogoMediaId: "global-logo",
  });

  assert.equal(direct.representative_logo_media_id, "direct-logo");
  assert.equal(global.representative_logo_media_id, "global-logo");
});

test("POST omits representative logo column when fields are omitted", async () => {
  const payload = await invokeCountrySave(directCountryScope, {});

  assert.equal("representative_logo_media_id" in payload, false);
});

test("POST includes null for an authorized explicit clear", async () => {
  const payload = await invokeCountrySave(directCountryScope, {
    representativeLogoMediaId: null,
    representativeLogoMediaUrl: "",
  });

  assert.equal("representative_logo_media_id" in payload, true);
  assert.equal(payload.representative_logo_media_id, null);
});
