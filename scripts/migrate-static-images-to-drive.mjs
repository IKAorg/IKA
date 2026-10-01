import { createDecipheriv, randomUUID } from "node:crypto";
import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const root = process.cwd();

async function loadEnv(file) {
  try {
    const text = await readFile(path.join(root, file), "utf8");
    for (const line of text.split(/\r?\n/)) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (!match || (process.env[match[1]] && !process.env[match[1]].includes("[SENSITIVE]"))) continue;
      let value = match[2].trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
      if (value.includes("[SENSITIVE]")) continue;
      process.env[match[1]] = value;
    }
  } catch {}
}

await loadEnv(".env.production");
await loadEnv(".env.local");

const required = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "GOOGLE_DRIVE_CLIENT_ID", "GOOGLE_DRIVE_CLIENT_SECRET", "GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY"];
for (const key of required) if (!process.env[key]) throw new Error(`Missing ${key}`);

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function decrypt(connection) {
  const raw = Buffer.from(process.env.GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY, "base64");
  const key = raw.length === 32 ? raw : Buffer.from(process.env.GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY, "hex");
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(connection.token_iv, "base64"));
  decipher.setAuthTag(Buffer.from(connection.token_auth_tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(connection.encrypted_refresh_token, "base64")), decipher.final()]).toString("utf8");
}

async function accessToken() {
  const { data, error } = await admin.from("google_drive_connections").select("encrypted_refresh_token,token_iv,token_auth_tag").eq("provider", "google_drive").single();
  if (error || !data) throw error || new Error("Drive is not connected");
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: process.env.GOOGLE_DRIVE_CLIENT_ID, client_secret: process.env.GOOGLE_DRIVE_CLIENT_SECRET, refresh_token: decrypt(data), grant_type: "refresh_token" }),
  });
  const result = await response.json();
  if (!response.ok || !result.access_token) throw new Error(result.error_description || "Could not refresh Drive token");
  return result.access_token;
}

async function walk(dir) {
  const output = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) output.push(...await walk(full));
    else if (/\.(jpe?g|png|webp)$/i.test(entry.name)) output.push(full);
  }
  return output;
}

function categoryFor(url) {
  if (url.includes("/reports/") || url.includes("/archive/")) return "archive";
  if (url.includes("/instructor")) return "instructors";
  if (url.includes("/countries/") || url.includes("/dojos/")) return "locations";
  if (url.includes("/event")) return "events";
  if (url.includes("/news")) return "news";
  return "pages";
}

function shouldMigrate(url) {
  return !/(\/flags\/|\/logo|\/icons?\/|favicon|apple-touch)/i.test(url);
}

const token = await accessToken();
async function findOrCreateFolder(name, parentId) {
  const escaped = name.replaceAll("'", "\\'");
  const parentClause = parentId ? ` and '${parentId}' in parents` : "";
  const query = encodeURIComponent(`name='${escaped}' and mimeType='application/vnd.google-apps.folder' and trashed=false${parentClause}`);
  const found = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id)&spaces=drive`, { headers: { authorization: `Bearer ${token}` } });
  const foundBody = await found.json();
  if (found.ok && foundBody.files?.[0]?.id) return foundBody.files[0].id;
  const created = await fetch("https://www.googleapis.com/drive/v3/files?fields=id", { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ name, mimeType: "application/vnd.google-apps.folder", ...(parentId ? { parents: [parentId] } : {}) }) });
  const body = await created.json();
  if (!created.ok || !body.id) throw new Error(body.error?.message || `Could not create ${name}`);
  return body.id;
}
const rootFolder = await findOrCreateFolder("IKA Web Media");
const publicFolder = await findOrCreateFolder("Public", rootFolder);
const privateFolder = await findOrCreateFolder("Private", rootFolder);
const folders = {
  root: rootFolder,
  public: publicFolder,
  private: privateFolder,
  news: await findOrCreateFolder("News", publicFolder),
  events: await findOrCreateFolder("Events", publicFolder),
  pages: await findOrCreateFolder("Pages", publicFolder),
  locations: await findOrCreateFolder("Countries and Dojos", publicFolder),
  instructors: await findOrCreateFolder("Instructors", publicFolder),
  archive: await findOrCreateFolder("Archive", publicFolder),
  profiles: await findOrCreateFolder("Kenshi Profiles", privateFolder),
};
const folderSaved = await admin.from("google_drive_connections").update({ root_folder_id: folders.root, folder_map: folders }).eq("provider", "google_drive");
if (folderSaved.error) throw folderSaved.error;
const files = (await walk(path.join(root, "public"))).map((file) => ({ file, url: `/${path.relative(path.join(root, "public"), file).replaceAll("\\", "/")}` })).filter(({ url }) => shouldMigrate(url));
const mapping = {};

async function uploadOptimized({ input, originalName, category, visibility, sourceKey, sourceUrl, memberId = null }) {
  const existing = await admin.from("drive_media_assets").select("id,migration_status").eq("source_key", sourceKey).maybeSingle();
  if (existing.data?.id && existing.data.migration_status === "verified") return existing.data.id;
  const optimized = await sharp(input).rotate().resize({ width: visibility === "private" ? 1200 : 1920, height: visibility === "private" ? 1200 : 1920, fit: "inside", withoutEnlargement: true }).webp({ quality: 82, effort: 5 }).toBuffer({ resolveWithObject: true });
  const assetId = existing.data?.id || randomUUID();
  const fileName = `${originalName.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 80)}-${assetId.slice(0, 8)}.webp`;
  const boundary = `ika-${randomUUID()}`;
  const metadata = JSON.stringify({ name: fileName, parents: [folders[category]] });
  const body = Buffer.concat([Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: image/webp\r\n\r\n`), optimized.data, Buffer.from(`\r\n--${boundary}--`)]);
  const response = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,size,md5Checksum", { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": `multipart/related; boundary=${boundary}` }, body });
  const drive = await response.json();
  if (!response.ok || !drive.id) throw new Error(`${sourceUrl}: ${drive.error?.message || "upload failed"}`);
  const row = { id: assetId, drive_file_id: drive.id, drive_folder_id: folders[category], category, visibility, member_id: memberId, file_name: fileName, mime_type: "image/webp", byte_size: Number(drive.size || optimized.data.length), width: optimized.info.width, height: optimized.info.height, etag: drive.md5Checksum || null, source_url: sourceUrl, source_key: sourceKey, migration_status: "verified", error_message: null };
  const saved = existing.data?.id ? await admin.from("drive_media_assets").update(row).eq("id", assetId) : await admin.from("drive_media_assets").insert(row);
  if (saved.error) throw saved.error;
  return assetId;
}

for (let index = 0; index < files.length; index += 1) {
  const { file, url } = files[index];
  const sourceKey = `static:${url}`;
  const existing = await admin.from("drive_media_assets").select("id,migration_status").eq("source_key", sourceKey).maybeSingle();
  if (existing.data?.id && existing.data.migration_status === "verified") {
    mapping[url] = existing.data.id;
    console.log(`[${index + 1}/${files.length}] exists ${url}`);
    continue;
  }
  const input = await readFile(file);
  const optimized = await sharp(input).rotate().resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true }).webp({ quality: 82, effort: 5 }).toBuffer({ resolveWithObject: true });
  const assetId = existing.data?.id || randomUUID();
  const fileName = `${path.basename(file, path.extname(file)).replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 80)}-${assetId.slice(0, 8)}.webp`;
  const category = categoryFor(url);
  const boundary = `ika-${randomUUID()}`;
  const metadata = JSON.stringify({ name: fileName, parents: [folders[category]] });
  const body = Buffer.concat([Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: image/webp\r\n\r\n`), optimized.data, Buffer.from(`\r\n--${boundary}--`)]);
  const response = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,size,md5Checksum", { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": `multipart/related; boundary=${boundary}` }, body });
  const drive = await response.json();
  if (!response.ok || !drive.id) throw new Error(`${url}: ${drive.error?.message || "upload failed"}`);
  const row = {
    id: assetId, drive_file_id: drive.id, drive_folder_id: folders[category], category, visibility: "public", file_name: fileName,
    mime_type: "image/webp", byte_size: Number(drive.size || optimized.data.length), width: optimized.info.width, height: optimized.info.height,
    etag: drive.md5Checksum || null, source_url: url, source_key: sourceKey, migration_status: "verified", error_message: null,
  };
  const saved = existing.data?.id ? await admin.from("drive_media_assets").update(row).eq("id", assetId) : await admin.from("drive_media_assets").insert(row);
  if (saved.error) throw saved.error;
  mapping[url] = assetId;
  console.log(`[${index + 1}/${files.length}] migrated ${url}`);
}

const databaseSources = [
  { table: "members", column: "profile_image_url", category: "profiles", visibility: "private" },
  { table: "official_instructors", column: "photo_url", category: "instructors", visibility: "public" },
  { table: "news", column: "cover_image_url", category: "news", visibility: "public" },
  { table: "events", column: "cover_image_url", category: "events", visibility: "public" },
];
for (const source of databaseSources) {
  const result = await admin.from(source.table).select(`id,${source.column}`).not(source.column, "is", null);
  if (result.error) throw result.error;
  for (const row of result.data || []) {
    const url = row[source.column];
    if (!url || url.startsWith("/api/media/")) continue;
    const response = await fetch(url.startsWith("/") ? `https://ika-po1s.vercel.app${url}` : url);
    if (!response.ok) throw new Error(`Could not download ${source.table}:${row.id}`);
    const assetId = await uploadOptimized({ input: Buffer.from(await response.arrayBuffer()), originalName: path.basename(new URL(url, "https://ika-po1s.vercel.app").pathname) || "image", category: source.category, visibility: source.visibility, sourceKey: `db:${source.table}:${row.id}:${source.column}`, sourceUrl: url, memberId: source.table === "members" ? row.id : null });
    const mediaUrl = `/api/media/${source.visibility}/${assetId}`;
    const updated = await admin.from(source.table).update({ [source.column]: mediaUrl }).eq("id", row.id);
    if (updated.error) throw updated.error;
    console.log(`database migrated ${source.table}:${row.id}`);
  }
}

const staticAssets = await admin.from("drive_media_assets").select("id,source_url").like("source_key", "static:%").eq("migration_status", "verified");
if (staticAssets.error) throw staticAssets.error;
for (const asset of staticAssets.data || []) if (asset.source_url) mapping[asset.source_url] = asset.id;

await writeFile(path.join(root, "lib/google-drive/static-media-map.json"), `${JSON.stringify(mapping, null, 2)}\n`);
console.log(`Migrated ${Object.keys(mapping).length} static photographs.`);
