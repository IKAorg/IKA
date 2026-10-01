import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";
import { optimizeImage } from "./image-processing.ts";

test("converts public images to bounded WebP", async () => {
  const input = await sharp({ create: { width: 2400, height: 1200, channels: 3, background: "red" } }).png().toBuffer();
  const result = await optimizeImage(input, "public");
  assert.equal(result.mimeType, "image/webp");
  assert.equal(result.width, 1920);
  assert.equal(result.height, 960);
});

test("uses the smaller private profile limit", async () => {
  const input = await sharp({ create: { width: 900, height: 1800, channels: 3, background: "white" } }).jpeg().toBuffer();
  const result = await optimizeImage(input, "private");
  assert.equal(result.height, 1200);
  assert.equal(result.width, 600);
});

test("rejects non-images", async () => {
  await assert.rejects(() => optimizeImage(Buffer.from("not an image"), "public"));
});

