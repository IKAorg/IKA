export type DriveUploadCategory = "news" | "events" | "pages" | "locations" | "instructors" | "archive" | "profiles";

export async function uploadImageToDrive(file: File, category: DriveUploadCategory, options?: {
  visibility?: "public" | "private";
  memberId?: string;
}) {
  const form = new FormData();
  form.set("file", file);
  form.set("category", category);
  form.set("visibility", options?.visibility || "public");
  if (options?.memberId) form.set("memberId", options.memberId);
  const response = await fetch("/api/admin/media/upload", { method: "POST", body: form });
  const result = (await response.json()) as { url?: string; error?: string };
  if (!response.ok || !result.url) throw new Error(result.error || "No se pudo subir la imagen a Google Drive.");
  return result.url;
}
