import sharp from "sharp";

const maxInputBytes = 20 * 1024 * 1024;

export async function optimizeImage(input: Buffer, visibility: "public" | "private") {
  if (!input.length || input.length > maxInputBytes) {
    throw new Error("La imagen debe ocupar entre 1 byte y 20 MB.");
  }
  const maxDimension = visibility === "private" ? 1200 : 1920;
  const image = sharp(input, { failOn: "warning", limitInputPixels: 80_000_000 }).rotate();
  const metadata = await image.metadata();
  if (!metadata.width || !metadata.height || !metadata.format) throw new Error("El archivo no es una imagen valida.");
  const output = await image
    .resize({ width: maxDimension, height: maxDimension, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82, effort: 5 })
    .toBuffer({ resolveWithObject: true });
  return {
    buffer: output.data,
    mimeType: "image/webp",
    width: output.info.width,
    height: output.info.height,
    byteSize: output.info.size,
  };
}

