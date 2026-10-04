import assert from "node:assert/strict";
import test from "node:test";

// Node's type-stripping runner requires the source extension; the app tsconfig does not enable it.
// @ts-expect-error TS5097
import { assertPublicRemoteUrl, discoverRemoteLogos, extractLogoCandidates } from "./remote-logo-discovery.ts";

const publicResolver = async () => [{ address: "93.184.216.34", family: 4 as const }];

test("assertPublicRemoteUrl accepts an HTTP URL resolving to a public address", async () => {
  const url = await assertPublicRemoteUrl("https://example.com/logo", publicResolver);
  assert.equal(url.href, "https://example.com/logo");
});

test("assertPublicRemoteUrl rejects protocols, credentials, and private literal hosts", async () => {
  for (const value of [
    "file:///etc/passwd",
    "ftp://example.com/logo",
    "https://user:pass@example.com/logo",
    "http://localhost/logo",
    "http://127.0.0.1/logo",
    "http://10.0.0.1/logo",
    "http://100.64.0.1/logo",
    "http://169.254.1.1/logo",
    "http://192.0.2.1/logo",
    "http://198.18.0.1/logo",
    "http://198.51.100.1/logo",
    "http://203.0.113.1/logo",
    "http://[::1]/logo",
    "http://[::]/logo",
    "http://[fc00::1]/logo",
    "http://[ff02::1]/logo",
    "http://[2001:2::1]/logo",
    "http://[2001:db8::1]/logo",
    "http://[::ffff:192.168.1.1]/logo",
  ]) {
    await assert.rejects(() => assertPublicRemoteUrl(value, publicResolver));
  }
});

test("assertPublicRemoteUrl rejects hostnames resolving to non-public addresses", async () => {
  const privateResolver = async () => [
    { address: "93.184.216.34", family: 4 as const },
    { address: "192.168.1.5", family: 4 as const },
  ];
  await assert.rejects(() => assertPublicRemoteUrl("https://example.com", privateResolver));
});

test("extractLogoCandidates resolves URLs and ranks logo, og image, apple icon, then icons by size", () => {
  const html = `
    <link rel="icon" sizes="32x32" href="/small.png">
    <meta name="og:image" content="//cdn.example.com/social.png">
    <link rel="apple-touch-icon" href="touch.png">
    <link rel="icon" sizes="256x256" href="/large.png">
    <link rel="logo alternate" href="/brand.svg">
    <link rel="icon" href="data:image/png;base64,nope">
    <link rel="icon" href="javascript:alert(1)">
  `;
  assert.deepEqual(extractLogoCandidates(html, new URL("https://example.com/about/")), [
    { url: "https://example.com/brand.svg", source: "logo", label: "Logo" },
    { url: "https://cdn.example.com/social.png", source: "og-image", label: "Open Graph image" },
    { url: "https://example.com/about/touch.png", source: "apple-touch-icon", label: "Apple touch icon" },
    { url: "https://example.com/large.png", source: "icon", label: "Icon 256x256" },
    { url: "https://example.com/small.png", source: "icon", label: "Icon 32x32" },
  ]);
});

test("extractLogoCandidates deduplicates URLs and returns at most six", () => {
  const links = Array.from({ length: 8 }, (_, index) =>
    `<link rel="icon" sizes="${index + 1}x${index + 1}" href="/${index}.png">`,
  ).join("");
  const html = `<link rel="logo" href="/0.png"><meta property="og:image" content="/0.png">${links}`;
  const result = extractLogoCandidates(html, new URL("https://example.com"));
  assert.equal(result.length, 6);
  assert.equal(result[0]?.source, "logo");
  assert.equal(new Set(result.map((candidate) => candidate.url)).size, 6);
});

test("extractLogoCandidates rejects candidate URLs containing credentials", () => {
  const html = `
    <link rel="logo" href="https://user:secret@example.com/logo.svg">
    <meta property="og:image" content="https://example.com/social.png">
  `;
  assert.deepEqual(extractLogoCandidates(html, new URL("https://example.com")), [
    { url: "https://example.com/social.png", source: "og-image", label: "Open Graph image" },
  ]);
});

test("extractLogoCandidates handles quoted angle brackets, ignores inert text, and decodes URL entities", () => {
  const html = `
    <!-- <link rel="logo" href="/comment.svg"> -->
    <script data-value=">">const fake = '<link rel="logo" href="/script.svg">';</script>
    <link rel="logo" href="/brand>mark.svg?one=1&amp;two=2">
    <link rel="apple-touch-icon" href="&#47;touch&#x2e;png">
  `;
  assert.deepEqual(extractLogoCandidates(html, new URL("https://example.com")), [
    { url: "https://example.com/brand%3Emark.svg?one=1&two=2", source: "logo", label: "Logo" },
    { url: "https://example.com/touch.png", source: "apple-touch-icon", label: "Apple touch icon" },
  ]);
});

function response(body: string, init: ResponseInit = {}) {
  return new Response(body, init);
}

test("discoverRemoteLogos follows a validated public redirect", async () => {
  const calls: string[] = [];
  const fetchImpl = async (input: string | URL | Request) => {
    const url = String(input);
    calls.push(url);
    if (calls.length === 1) return response("", { status: 302, headers: { location: "/home" } });
    return response('<link rel="logo" href="/logo.svg">', { headers: { "content-type": "text/html" } });
  };
  const result = await discoverRemoteLogos("https://example.com", { fetchImpl, resolver: publicResolver });
  assert.deepEqual(calls, ["https://example.com/", "https://example.com/home"]);
  assert.equal(result[0]?.url, "https://example.com/logo.svg");
});

test("discoverRemoteLogos pins the connection to the address from its only DNS lookup", async () => {
  let resolutions = 0;
  const resolver = async () => {
    resolutions += 1;
    return [{ address: resolutions === 1 ? "93.184.216.34" : "127.0.0.1", family: 4 }];
  };
  const transport = async (url: URL, address: { address: string; family: number }) => {
    assert.equal(url.hostname, "example.com");
    assert.deepEqual(address, { address: "93.184.216.34", family: 4 });
    return response('<link rel="logo" href="/logo.svg">', { headers: { "content-type": "text/html" } });
  };

  await discoverRemoteLogos("https://example.com", { resolver, transport });
  assert.equal(resolutions, 1);
});

test("discoverRemoteLogos cancels redirect and rejected response bodies", async () => {
  const cancelled: string[] = [];
  const trackedResponse = (name: string, init: ResponseInit) => new Response(
    new ReadableStream({ cancel: () => { cancelled.push(name); } }),
    init,
  );
  let request = 0;
  const redirectFetch = async () => {
    request += 1;
    if (request === 1) {
      return trackedResponse("redirect", { status: 302, headers: { location: "/next" } });
    }
    return response("<html></html>", { headers: { "content-type": "text/html" } });
  };
  await discoverRemoteLogos("https://example.com", { fetchImpl: redirectFetch, resolver: publicResolver });
  assert.deepEqual(cancelled, ["redirect"]);

  const rejectedFetch = async () => trackedResponse("rejected", {
    status: 415,
    headers: { "content-type": "image/png" },
  });
  await assert.rejects(
    () => discoverRemoteLogos("https://example.com", { fetchImpl: rejectedFetch, resolver: publicResolver }),
    /HTTP 415/,
  );
  assert.deepEqual(cancelled, ["redirect", "rejected"]);

  const nonHtmlFetch = async () => trackedResponse("non-html", {
    headers: { "content-type": "image/png" },
  });
  await assert.rejects(
    () => discoverRemoteLogos("https://example.com", { fetchImpl: nonHtmlFetch, resolver: publicResolver }),
    /HTML/,
  );

  const oversizedFetch = async () => trackedResponse("oversized", {
    headers: { "content-type": "text/html", "content-length": "100" },
  });
  await assert.rejects(
    () => discoverRemoteLogos("https://example.com", {
      fetchImpl: oversizedFetch,
      resolver: publicResolver,
      maxBytes: 10,
    }),
    /large/,
  );
  assert.deepEqual(cancelled, ["redirect", "rejected", "non-html", "oversized"]);
});

test("discoverRemoteLogos rejects a redirect to a private host", async () => {
  const fetchImpl = async () => response("", { status: 302, headers: { location: "http://127.0.0.1/logo" } });
  await assert.rejects(
    () => discoverRemoteLogos("https://example.com", { fetchImpl, resolver: publicResolver }),
    /public/i,
  );
});

test("discoverRemoteLogos enforces the redirect limit", async () => {
  const fetchImpl = async (input: string | URL | Request) =>
    response("", { status: 302, headers: { location: `${String(input)}x` } });
  await assert.rejects(
    () => discoverRemoteLogos("https://example.com", { fetchImpl, resolver: publicResolver }),
    /redirect/i,
  );
});

test("discoverRemoteLogos aborts timed-out requests", async () => {
  const fetchImpl = async (_input: string | URL | Request, init?: RequestInit) =>
    await new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
    });
  await assert.rejects(
    () => discoverRemoteLogos("https://example.com", { fetchImpl, resolver: publicResolver, timeoutMs: 5 }),
    /timed out/i,
  );
});

test("discoverRemoteLogos times out while DNS resolution is pending", async () => {
  const resolver = async () => await new Promise<never>(() => {});
  const fetchImpl = async () => {
    assert.fail("fetch must not run before DNS resolution completes");
  };
  await assert.rejects(
    () => discoverRemoteLogos("https://example.com", { fetchImpl, resolver, timeoutMs: 5 }),
    /timed out/i,
  );
});

test("discoverRemoteLogos rejects oversized and non-HTML responses", async () => {
  const oversizedFetch = async () => response("x".repeat(21), { headers: { "content-type": "text/html" } });
  await assert.rejects(
    () => discoverRemoteLogos("https://example.com", { fetchImpl: oversizedFetch, resolver: publicResolver, maxBytes: 20 }),
    /large/i,
  );

  const imageFetch = async () => response("png", { headers: { "content-type": "image/png" } });
  await assert.rejects(
    () => discoverRemoteLogos("https://example.com", { fetchImpl: imageFetch, resolver: publicResolver }),
    /HTML/i,
  );
});
