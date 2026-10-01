import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

// Full Drive access is required to adopt and migrate the pre-existing IKA folder tree.
const oauthScope = "https://www.googleapis.com/auth/drive";

function credentials() {
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) throw new Error("Falta configurar OAuth de Google Drive.");
  return { clientId, clientSecret };
}

function stateKey() {
  const key = process.env.GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY?.trim();
  if (!key) throw new Error("Falta GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY.");
  return key;
}

export function createOauthState() {
  const nonce = randomBytes(24).toString("base64url");
  const signature = createHmac("sha256", stateKey()).update(nonce).digest("base64url");
  return `${nonce}.${signature}`;
}

export function verifyOauthState(state: string) {
  const [nonce, signature] = state.split(".");
  if (!nonce || !signature) return false;
  const expected = createHmac("sha256", stateKey()).update(nonce).digest();
  const supplied = Buffer.from(signature, "base64url");
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

export function getGoogleAuthorizationUrl(redirectUri: string, state: string) {
  const { clientId } = credentials();
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: oauthScope,
    access_type: "offline",
    prompt: "consent",
    state,
  }).toString();
  return url.toString();
}

export async function exchangeAuthorizationCode(code: string, redirectUri: string) {
  const { clientId, clientSecret } = credentials();
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  const result = (await response.json()) as { access_token?: string; refresh_token?: string; error_description?: string };
  if (!response.ok || !result.access_token || !result.refresh_token) {
    throw new Error(result.error_description || "Google no devolvio un token renovable.");
  }
  return result;
}

export async function refreshAccessToken(refreshToken: string) {
  const { clientId, clientSecret } = credentials();
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
  });
  const result = (await response.json()) as { access_token?: string; error_description?: string };
  if (!response.ok || !result.access_token) throw new Error(result.error_description || "No se pudo renovar Drive.");
  return result.access_token;
}
