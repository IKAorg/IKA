import { promises as dns } from "node:dns";
import { isIP } from "node:net";

export type RemoteLogoCandidate = {
  url: string;
  source: "logo" | "og-image" | "apple-touch-icon" | "icon";
  label: string;
};

type LookupAddress = { address: string; family: number };
type Resolver = (hostname: string) => Promise<LookupAddress[]>;
type FetchImplementation = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

export type RemoteLogoDiscoveryOptions = {
  fetchImpl?: FetchImplementation;
  resolver?: Resolver;
  timeoutMs?: number;
  maxBytes?: number;
};

const defaultResolver: Resolver = async (hostname) =>
  await dns.lookup(hostname, { all: true, verbatim: true });

export async function assertPublicRemoteUrl(
  value: string,
  resolver: Resolver = defaultResolver,
): Promise<URL> {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Remote URL is malformed");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Remote URL must use HTTP or HTTPS");
  }
  if (url.username || url.password) {
    throw new Error("Remote URL must not contain credentials");
  }

  const hostname = stripIpv6Brackets(url.hostname).toLowerCase();
  if (!hostname || hostname === "localhost" || hostname.endsWith(".localhost")) {
    throw new Error("Remote URL must use a public host");
  }

  const literalFamily = isIP(hostname);
  const addresses = literalFamily
    ? [{ address: hostname, family: literalFamily }]
    : await resolver(hostname);

  if (addresses.length === 0 || addresses.some(({ address }) => !isPublicIp(address))) {
    throw new Error("Remote URL must resolve only to public addresses");
  }
  return url;
}

export function extractLogoCandidates(html: string, pageUrl: URL): RemoteLogoCandidate[] {
  const ranked: Array<RemoteLogoCandidate & { quality: number; order: number }> = [];
  let order = 0;

  for (const tag of html.match(/<(?:link|meta)\b[^>]*>/gi) ?? []) {
    const name = /^<\s*(link|meta)\b/i.exec(tag)?.[1]?.toLowerCase();
    const attributes = parseAttributes(tag);
    if (name === "meta") {
      const key = (attributes.property || attributes.name || "").toLowerCase();
      if (key === "og:image" && attributes.content) {
        addCandidate(ranked, pageUrl, attributes.content, "og-image", "Open Graph image", 0, order++);
      }
      continue;
    }

    const rels = (attributes.rel || "").toLowerCase().split(/\s+/).filter(Boolean);
    if (!attributes.href) continue;
    if (rels.includes("logo")) {
      addCandidate(ranked, pageUrl, attributes.href, "logo", "Logo", 0, order++);
    } else if (rels.includes("apple-touch-icon")) {
      addCandidate(ranked, pageUrl, attributes.href, "apple-touch-icon", "Apple touch icon", 0, order++);
    } else if (rels.includes("icon") || rels.includes("shortcut")) {
      const quality = iconQuality(attributes.sizes);
      const suffix = attributes.sizes ? ` ${attributes.sizes}` : "";
      addCandidate(ranked, pageUrl, attributes.href, "icon", `Icon${suffix}`, quality, order++);
    }
  }

  const priority = { logo: 0, "og-image": 1, "apple-touch-icon": 2, icon: 3 } as const;
  ranked.sort((a, b) =>
    priority[a.source] - priority[b.source] ||
    (a.source === "icon" ? b.quality - a.quality : 0) ||
    a.order - b.order,
  );

  const seen = new Set<string>();
  const result: RemoteLogoCandidate[] = [];
  for (const { url, source, label } of ranked) {
    if (seen.has(url)) continue;
    seen.add(url);
    result.push({ url, source, label });
    if (result.length === 6) break;
  }
  return result;
}

export async function discoverRemoteLogos(
  website: string,
  options: RemoteLogoDiscoveryOptions = {},
): Promise<RemoteLogoCandidate[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const resolver = options.resolver ?? defaultResolver;
  const timeoutMs = options.timeoutMs ?? 10_000;
  const maxBytes = options.maxBytes ?? 2 * 1024 * 1024;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let url = await assertPublicRemoteUrl(website, resolver);
    for (let redirects = 0; ; redirects += 1) {
      let response: Response;
      try {
        response = await fetchImpl(url, { redirect: "manual", signal: controller.signal });
      } catch (error) {
        if (controller.signal.aborted) throw new Error("Remote website request timed out");
        throw error;
      }

      if (response.status >= 300 && response.status < 400) {
        if (redirects >= 5) throw new Error("Remote website exceeded the redirect limit");
        const location = response.headers.get("location");
        if (!location) throw new Error("Remote website returned a redirect without a location");
        url = await assertPublicRemoteUrl(new URL(location, url).href, resolver);
        continue;
      }

      if (!response.ok) throw new Error(`Remote website returned HTTP ${response.status}`);
      const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
      if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
        throw new Error("Remote website did not return HTML content");
      }
      const html = await readBoundedText(response, maxBytes);
      return extractLogoCandidates(html, url);
    }
  } finally {
    clearTimeout(timer);
  }
}

function parseAttributes(tag: string) {
  const attributes: Record<string, string> = {};
  const pattern = /([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
  for (const match of tag.matchAll(pattern)) {
    attributes[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? "";
  }
  return attributes;
}

function addCandidate(
  candidates: Array<RemoteLogoCandidate & { quality: number; order: number }>,
  pageUrl: URL,
  value: string,
  source: RemoteLogoCandidate["source"],
  label: string,
  quality: number,
  order: number,
) {
  try {
    const url = new URL(value.trim(), pageUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") return;
    candidates.push({ url: url.href, source, label, quality, order });
  } catch {
    // Ignore malformed candidate URLs.
  }
}

function iconQuality(sizes?: string) {
  if (!sizes) return 0;
  if (sizes.toLowerCase() === "any") return Number.MAX_SAFE_INTEGER;
  return Math.max(0, ...sizes.split(/\s+/).map((size) => {
    const match = /^(\d+)x(\d+)$/i.exec(size);
    return match ? Number(match[1]) * Number(match[2]) : 0;
  }));
}

async function readBoundedText(response: Response, maxBytes: number) {
  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new Error("Remote website response is too large");
  }
  if (!response.body) return "";

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > maxBytes) {
      await reader.cancel();
      throw new Error("Remote website response is too large");
    }
    chunks.push(value);
  }
  const combined = new Uint8Array(bytes);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(combined);
}

function stripIpv6Brackets(hostname: string) {
  return hostname.startsWith("[") && hostname.endsWith("]") ? hostname.slice(1, -1) : hostname;
}

function isPublicIp(address: string) {
  const normalized = stripIpv6Brackets(address).toLowerCase().split("%")[0];
  const family = isIP(normalized);
  if (family === 4) return isPublicIpv4(normalized);
  if (family !== 6) return false;

  const groups = expandIpv6(normalized);
  if (!groups) return false;
  if (groups.slice(0, 5).every((group) => group === 0) && groups[5] === 0xffff) {
    return isPublicIpv4(`${groups[6] >> 8}.${groups[6] & 255}.${groups[7] >> 8}.${groups[7] & 255}`);
  }
  return !(
    groups.every((group) => group === 0) ||
    (groups.slice(0, 7).every((group) => group === 0) && groups[7] === 1) ||
    (groups[0] & 0xfe00) === 0xfc00 ||
    (groups[0] & 0xffc0) === 0xfe80 ||
    (groups[0] & 0xff00) === 0xff00 ||
    (groups[0] === 0x2001 && groups[1] === 0x0002 && groups[2] === 0) ||
    (groups[0] === 0x2001 && groups[1] === 0x0db8) ||
    (groups.slice(0, 6).every((group) => group === 0))
  );
}

function isPublicIpv4(address: string) {
  const [a, b, c] = address.split(".").map(Number);
  return !(
    a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113)
  );
}

function expandIpv6(address: string) {
  const [left, right = ""] = address.split("::");
  if (address.split("::").length > 2) return null;
  const leftParts = left ? left.split(":") : [];
  const rightParts = right ? right.split(":") : [];
  const missing = 8 - leftParts.length - rightParts.length;
  if (!address.includes("::") && missing !== 0) return null;
  if (missing < 0) return null;
  const parts = [...leftParts, ...Array(missing).fill("0"), ...rightParts];
  if (parts.length !== 8 || parts.some((part) => !/^[0-9a-f]{1,4}$/i.test(part))) return null;
  return parts.map((part) => Number.parseInt(part, 16));
}
