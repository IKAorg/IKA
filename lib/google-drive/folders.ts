import type { SupabaseAdminClient } from "@/lib/admin/request-forms";
import { driveFolderIds, type DriveFolderMap, type DriveMediaCategory } from "./config";

const folderNames = {
  root: "IKA Web Media",
  public: "Public",
  private: "Private",
  news: "News",
  events: "Events",
  pages: "Pages",
  locations: "Countries and Dojos",
  instructors: "Instructors",
  archive: "Archive",
  profiles: "Kenshi Profiles",
} as const;

async function findOrCreate(accessToken: string, name: string, parentId?: string) {
  const escaped = name.replaceAll("'", "\\'");
  const parentClause = parentId ? ` and '${parentId}' in parents` : "";
  const query = encodeURIComponent(`name='${escaped}' and mimeType='application/vnd.google-apps.folder' and trashed=false${parentClause}`);
  const found = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)&spaces=drive`, { headers: { authorization: `Bearer ${accessToken}` } });
  const foundBody = (await found.json()) as { files?: Array<{ id: string }> };
  if (found.ok && foundBody.files?.[0]?.id) return foundBody.files[0].id;
  const created = await fetch("https://www.googleapis.com/drive/v3/files?fields=id", {
    method: "POST",
    headers: { authorization: `Bearer ${accessToken}`, "content-type": "application/json" },
    body: JSON.stringify({ name, mimeType: "application/vnd.google-apps.folder", ...(parentId ? { parents: [parentId] } : {}) }),
  });
  const createdBody = (await created.json()) as { id?: string; error?: { message?: string } };
  if (!created.ok || !createdBody.id) throw new Error(createdBody.error?.message || `No se pudo crear ${name}.`);
  return createdBody.id;
}

export async function ensureDriveFolderTree(accessToken: string): Promise<DriveFolderMap> {
  const root = await findOrCreate(accessToken, folderNames.root);
  const publicId = await findOrCreate(accessToken, folderNames.public, root);
  const privateId = await findOrCreate(accessToken, folderNames.private, root);
  return {
    root,
    public: publicId,
    private: privateId,
    news: await findOrCreate(accessToken, folderNames.news, publicId),
    events: await findOrCreate(accessToken, folderNames.events, publicId),
    pages: await findOrCreate(accessToken, folderNames.pages, publicId),
    locations: await findOrCreate(accessToken, folderNames.locations, publicId),
    instructors: await findOrCreate(accessToken, folderNames.instructors, publicId),
    archive: await findOrCreate(accessToken, folderNames.archive, publicId),
    profiles: await findOrCreate(accessToken, folderNames.profiles, privateId),
  };
}

export async function getConnectedFolderId(admin: SupabaseAdminClient, category: DriveMediaCategory) {
  const result = await admin.from("google_drive_connections").select("folder_map").eq("provider", "google_drive").maybeSingle();
  const map = result.data?.folder_map as Partial<DriveFolderMap> | undefined;
  return map?.[category] || driveFolderIds[category];
}
