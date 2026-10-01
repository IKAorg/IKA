import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

export type EncryptedSecret = {
  encrypted: string;
  iv: string;
  authTag: string;
};

function getKey(keyValue = process.env.GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY) {
  if (!keyValue) {
    throw new Error("Falta GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY.");
  }

  const key = Buffer.from(keyValue, "base64");
  if (key.length !== 32) {
    throw new Error("GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY debe contener 32 bytes en base64.");
  }
  return key;
}

export function encryptSecret(value: string, keyValue?: string): EncryptedSecret {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(keyValue), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);

  return {
    encrypted: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
  };
}

export function decryptSecret(secret: EncryptedSecret, keyValue?: string) {
  const decipher = createDecipheriv(
    "aes-256-gcm",
    getKey(keyValue),
    Buffer.from(secret.iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(secret.authTag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(secret.encrypted, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

