import { randomUUID } from "node:crypto";
import type { SupabaseAdminClient } from "@/lib/admin/request-forms";
import { driveFetch } from "./client";
import type { DriveMediaCategory } from "./config";
import { getConnectedFolderId } from "./folders";
import { optimizeImage } from "./image-processing";

export async function uploadDriveImage(args: {
  admin: SupabaseAdminClient;
  input: Buffer;
  originalName: string;
  category: DriveMediaCategory;
  visibility: "public" | "private";
  memberId?: string | null;
  profileId?: string | null;
  sourceKey?: string;
  sourceUrl?: string | null;
}) {
  const optimized = await optimizeImage(args.input, args.visibility);
  const assetId = randomUUID();
  const cleanBase = args.originalName.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 80) || "image";
  const fileName = `${cleanBase}-${assetId.slice(0, 8)}.webp`;
  const folderId = await getConnectedFolderId(args.admin, args.category);
  const boundary = `ika-${randomUUID()}`;
  const metadata = JSON.stringify({ name: fileName, parents: [folderId] });
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: image/webp\r\n\r\n`),
    optimized.buffer,
    Buffer.from(`\r\n--${boundary}--`),
  ]);
  const response = await driveFetch(
    args.admin,
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,md5Checksum",
    { method: "POST", headers: { "content-type": `multipart/related; boundary=${boundary}` }, body },
  );
  const driveFile = (await response.json()) as { id?: string; size?: string; md5Checksum?: string; error?: { message?: string } };
  if (!response.ok || !driveFile.id) throw new Error(driveFile.error?.message || "No se pudo subir la imagen a Drive.");

  const inserted = await args.admin.from("drive_media_assets").insert({
    id: assetId,
    drive_file_id: driveFile.id,
    drive_folder_id: folderId,
    category: args.category,
    visibility: args.visibility,
    member_id: args.memberId || null,
    file_name: fileName,
    mime_type: optimized.mimeType,
    byte_size: Number(driveFile.size || optimized.byteSize),
    width: optimized.width,
    height: optimized.height,
    etag: driveFile.md5Checksum || null,
    source_url: args.sourceUrl || null,
    source_key: args.sourceKey || `upload:${assetId}`,
    migration_status: "verified",
    created_by: args.profileId || null,
  }).select("id").single();
  if (inserted.error) {
    await driveFetch(args.admin, `https://www.googleapis.com/drive/v3/files/${driveFile.id}`, { method: "DELETE" });
    throw inserted.error;
  }
  return {
    assetId,
    url: `/api/media/${args.visibility}/${assetId}`,
    width: optimized.width,
    height: optimized.height,
    byteSize: optimized.byteSize,
  };
}

export async function fetchDriveAsset(admin: SupabaseAdminClient, assetId: string) {
  const asset = await admin.from("drive_media_assets")
    .select("id,drive_file_id,visibility,member_id,mime_type,etag")
    .eq("id", assetId).eq("migration_status", "verified").maybeSingle();
  const record = asset.data as {
    id: string;
    drive_file_id: string;
    visibility: "public" | "private";
    member_id: string | null;
    mime_type: string;
    etag: string | null;
  } | null;
  if (asset.error || !record?.drive_file_id) return null;
  const response = await driveFetch(admin, `https://www.googleapis.com/drive/v3/files/${record.drive_file_id}?alt=media`);
  if (!response.ok) return null;
  return { asset: record, buffer: Buffer.from(await response.arrayBuffer()) };
}
