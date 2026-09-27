import assert from "node:assert/strict";
import test from "node:test";

import { getMemberImportIdentityStrategy } from "./member-import-identity.ts";

test("uses only the club member ID when it is present", () => {
  assert.equal(
    getMemberImportIdentityStrategy({
      externalMemberId: "SKBC-002",
      email: "familia@example.com",
    }),
    "external",
  );
});

test("uses email when no club member ID is present", () => {
  assert.equal(
    getMemberImportIdentityStrategy({
      externalMemberId: "",
      email: "kenshi@example.com",
    }),
    "email",
  );
});

test("uses name within the dojo when neither ID nor email is present", () => {
  assert.equal(
    getMemberImportIdentityStrategy({ externalMemberId: "", email: "" }),
    "name",
  );
});
