import assert from "node:assert/strict";
import test from "node:test";
import { randomBytes } from "node:crypto";

import { decryptSecret, encryptSecret } from "./crypto.ts";

test("encrypts and decrypts a Drive refresh token", () => {
  const key = randomBytes(32).toString("base64");
  const encrypted = encryptSecret("refresh-token", key);
  assert.notEqual(encrypted.encrypted, "refresh-token");
  assert.equal(decryptSecret(encrypted, key), "refresh-token");
});

test("rejects decryption with a different key", () => {
  const encrypted = encryptSecret("refresh-token", randomBytes(32).toString("base64"));
  assert.throws(() => decryptSecret(encrypted, randomBytes(32).toString("base64")));
});

test("rejects malformed encryption keys", () => {
  assert.throws(() => encryptSecret("refresh-token", "not-a-valid-key"));
});

