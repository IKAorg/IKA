import { promises as dns } from "node:dns";
import http from "node:http";
import https from "node:https";
import { isIP } from "node:net";

export type RemoteLogoCandidate = {
  url: string;
  source: "logo" | "og-image" | "apple-touch-icon" | "icon";
  label: string;
};

export type RemoteAddress = { address: string; family: number };
type Resolver = (hostname: string) => Promise<RemoteAddress[]>;
type FetchImplementation = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;
type PinnedTransport = (url: URL, address: RemoteAddress, signal: AbortSignal) => Promise<Response>;

export type RemoteLogoDiscoveryOptions = {
  fetchImpl?: FetchImplementation;
  transport?: PinnedTransport;
  resolver?: Resolver;
  timeoutMs?: number;
  maxBytes?: number;
};

export type DownloadedRemoteImage = {
  buffer: Buffer;
  contentType: string;
  fileName: string;
};

const allowedImageTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
  ["image/svg+xml", "svg"],
]);

const defaultResolver: Resolver = async (hostname) =>
  await dns.lookup(hostname, { all: true, verbatim: true });

export async function assertPublicRemoteUrl(
  value: string,
  resolver: Resolver = defaultResolver,
): Promise<URL> {
  return (await resolvePublicRemoteUrl(value, resolver)).url;
}

async function resolvePublicRemoteUrl(value: string, resolver: Resolver) {
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
  return { url, addresses };
}

export function extractLogoCandidates(html: string, pageUrl: URL): RemoteLogoCandidate[] {
  const ranked: Array<RemoteLogoCandidate & { quality: number; order: number }> = [];
  let order = 0;

  for (const tag of findMetadataTags(html)) {
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
  const transport: PinnedTransport = options.transport ?? (options.fetchImpl
    ? async (url, _address, signal) => await options.fetchImpl!(url, { redirect: "manual", signal })
    : requestPinned);
  const resolver = options.resolver ?? defaultResolver;
  const timeoutMs = options.timeoutMs ?? 10_000;
  const maxBytes = options.maxBytes ?? 2 * 1024 * 1024;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let target = await rejectOnTimeout(resolvePublicRemoteUrl(website, resolver), controller.signal);
    for (let redirects = 0; ; redirects += 1) {
      let response: Response;
      try {
        response = await transport(target.url, target.addresses[0], controller.signal);
      } catch (error) {
        if (controller.signal.aborted) throw new Error("Remote website request timed out");
        throw error;
      }

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        await disposeResponse(response);
        if (redirects >= 5) throw new Error("Remote website exceeded the redirect limit");
        if (!location) throw new Error("Remote website returned a redirect without a location");
        target = await rejectOnTimeout(
          resolvePublicRemoteUrl(new URL(location, target.url).href, resolver),
          controller.signal,
        );
        continue;
      }

      if (!response.ok) {
        await disposeResponse(response);
        throw new Error(`Remote website returned HTTP ${response.status}`);
      }
      const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
      if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
        await disposeResponse(response);
        throw new Error("Remote website did not return HTML content");
      }
      const html = await readBoundedText(response, maxBytes);
      return extractLogoCandidates(html, target.url);
    }
  } finally {
    clearTimeout(timer);
  }
}

export async function downloadRemoteImage(
  imageUrl: string,
  options: RemoteLogoDiscoveryOptions = {},
): Promise<DownloadedRemoteImage> {
  const transport: PinnedTransport = options.transport ?? (options.fetchImpl
    ? async (url, _address, signal) => await options.fetchImpl!(url, { redirect: "manual", signal })
    : requestPinned);
  const resolver = options.resolver ?? defaultResolver;
  const timeoutMs = options.timeoutMs ?? 10_000;
  const maxBytes = options.maxBytes ?? 10 * 1024 * 1024;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let target = await rejectOnTimeout(resolvePublicRemoteUrl(imageUrl, resolver), controller.signal);
    for (let redirects = 0; ; redirects += 1) {
      let response: Response;
      try {
        response = await rejectOnTimeout(
          transport(target.url, target.addresses[0], controller.signal),
          controller.signal,
        );
      } catch (error) {
        if (controller.signal.aborted) throw new Error("Remote image request timed out");
        throw error;
      }

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        await disposeResponse(response);
        if (redirects >= 5) throw new Error("Remote image exceeded the redirect limit");
        if (!location) throw new Error("Remote image returned a redirect without a location");
        target = await rejectOnTimeout(
          resolvePublicRemoteUrl(new URL(location, target.url).href, resolver),
          controller.signal,
        );
        continue;
      }

      if (!response.ok) {
        await disposeResponse(response);
        throw new Error(`Remote image returned HTTP ${response.status}`);
      }

      const contentType = response.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase() ?? "";
      const extension = allowedImageTypes.get(contentType);
      if (!extension) {
        await disposeResponse(response);
        throw new Error("Remote response is not allowed image content");
      }

      const buffer = await readBoundedBuffer(response, maxBytes, controller.signal);
      if (!matchesImageContent(buffer, contentType)) {
        throw new Error("Remote response is not valid image content");
      }
      return {
        buffer,
        contentType,
        fileName: safeImageFileName(target.url, extension),
      };
    }
  } catch (error) {
    if (controller.signal.aborted) throw new Error("Remote image request timed out");
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function parseAttributes(tag: string) {
  const attributes: Record<string, string> = {};
  const pattern = /([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
  for (const match of tag.matchAll(pattern)) {
    attributes[match[1].toLowerCase()] = decodeHtmlEntities(match[2] ?? match[3] ?? match[4] ?? "");
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
    if (url.username || url.password) return;
    candidates.push({ url: url.href, source, label, quality, order });
  } catch {
    // Ignore malformed candidate URLs.
  }
}

async function rejectOnTimeout<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) throw new Error("Remote website request timed out");
  return await new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(new Error("Remote website request timed out"));
    signal.addEventListener("abort", onAbort, { once: true });
    promise.then(
      (value) => {
        signal.removeEventListener("abort", onAbort);
        resolve(value);
      },
      (error) => {
        signal.removeEventListener("abort", onAbort);
        reject(error);
      },
    );
  });
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
    await disposeResponse(response);
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

async function readBoundedBuffer(response: Response, maxBytes: number, signal: AbortSignal) {
  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    await disposeResponse(response);
    throw new Error("Remote image response is too large");
  }
  if (!response.body) return Buffer.alloc(0);

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const { done, value } = await rejectOnTimeout(reader.read(), signal);
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) throw new Error("Remote image response is too large");
      chunks.push(value);
    }
  } catch (error) {
    try {
      await reader.cancel();
    } catch {
      // The transport may already have closed the body.
    }
    throw error;
  }
  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)), bytes);
}

function safeImageFileName(url: URL, extension: string) {
  let pathname = url.pathname;
  try {
    pathname = decodeURIComponent(pathname);
  } catch {
    // Keep the encoded path when it contains malformed escapes.
  }
  const rawBase = pathname.split("/").pop()?.replace(/\.[^.]*$/, "") ?? "";
  const base = rawBase
    .replace(/[\0-\x1f\x7f]+/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "image";
  return `${base}.${extension}`;
}

function matchesImageContent(buffer: Buffer, contentType: string) {
  if (contentType === "image/jpeg") {
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (contentType === "image/png") {
    return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }
  if (contentType === "image/gif") {
    const signature = buffer.subarray(0, 6).toString("ascii");
    return signature === "GIF87a" || signature === "GIF89a";
  }
  if (contentType === "image/webp") {
    return buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
  }
  if (contentType === "image/svg+xml") {
    const prefix = buffer.subarray(0, 4096).toString("utf8")
      .replace(/^\uFEFF/, "")
      .replace(/^\s*<\?xml[^>]*>\s*/i, "")
      .replace(/^\s*<!--(?:.|[\r\n])*?-->\s*/i, "");
    return /^\s*<svg(?:\s|>)/i.test(prefix);
  }
  return false;
}

async function disposeResponse(response: Response) {
  if (!response.body) return;
  try {
    await response.body.cancel();
  } catch {
    // The transport may already have closed the body.
  }
}

function requestPinned(url: URL, address: RemoteAddress, signal: AbortSignal): Promise<Response> {
  return new Promise((resolve, reject) => {
    const client = url.protocol === "https:" ? https : http;
    const request = client.request(url, {
      method: "GET",
      headers: {
        accept: "text/html,application/xhtml+xml",
        "user-agent": "IKA-LogoDiscovery/1.0",
      },
      lookup: (_hostname, _options, callback) => {
        callback(null, address.address, address.family);
      },
      signal,
      ...(url.protocol === "https:" ? { servername: stripIpv6Brackets(url.hostname) } : {}),
    }, (incoming) => {
      const headers = new Headers();
      for (let index = 0; index < incoming.rawHeaders.length; index += 2) {
        headers.append(incoming.rawHeaders[index], incoming.rawHeaders[index + 1]);
      }
      const status = incoming.statusCode ?? 500;
      const bodyForbidden = status === 101 || status === 204 || status === 205 || status === 304;
      if (bodyForbidden) incoming.resume();
      const body = bodyForbidden ? null : new ReadableStream<Uint8Array>({
        start(controller) {
          incoming.on("data", (chunk: Buffer) => controller.enqueue(new Uint8Array(chunk)));
          incoming.on("end", () => controller.close());
          incoming.on("error", (error) => controller.error(error));
        },
        cancel() {
          incoming.destroy();
          request.destroy();
        },
      });
      resolve(new Response(body, { status, statusText: incoming.statusMessage, headers }));
    });
    request.on("error", reject);
    request.end();
  });
}

function findMetadataTags(html: string) {
  const visible = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "");
  const tags: string[] = [];
  let cursor = 0;
  while (cursor < visible.length) {
    const start = visible.indexOf("<", cursor);
    if (start < 0) break;
    const name = /^<\s*(link|meta)\b/i.exec(visible.slice(start))?.[1];
    if (!name) {
      cursor = start + 1;
      continue;
    }
    let quote = "";
    let end = start + 1;
    for (; end < visible.length; end += 1) {
      const character = visible[end];
      if (quote) {
        if (character === quote) quote = "";
      } else if (character === "\"" || character === "'") {
        quote = character;
      } else if (character === ">") {
        tags.push(visible.slice(start, end + 1));
        break;
      }
    }
    cursor = end + 1;
  }
  return tags;
}

function decodeHtmlEntities(value: string) {
  const named: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    quot: "\"",
  };
  return value.replace(/&(?:#(\d+)|#x([\da-f]+)|([a-z]+));/gi, (entity, decimal, hexadecimal, name) => {
    if (decimal || hexadecimal) {
      const codePoint = Number.parseInt(decimal ?? hexadecimal, decimal ? 10 : 16);
      try {
        return String.fromCodePoint(codePoint);
      } catch {
        return entity;
      }
    }
    return named[String(name).toLowerCase()] ?? entity;
  });
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
