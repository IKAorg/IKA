"use client";

type OptimizeImageOptions = {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxBytes?: number;
  outputType?: "image/webp" | "image/jpeg";
  fileNameBase?: string;
};

const DEFAULT_OPTIONS: Required<OptimizeImageOptions> = {
  maxWidth: 1600,
  maxHeight: 1600,
  quality: 0.8,
  maxBytes: 450 * 1024,
  outputType: "image/webp",
  fileNameBase: "image",
};

export async function optimizeImageForUpload(
  file: File,
  options: OptimizeImageOptions = {},
) {
  if (!file.type.startsWith("image/")) {
    return file;
  }

  if (file.type === "image/gif") {
    return file;
  }

  const config = { ...DEFAULT_OPTIONS, ...options };
  const source = await loadImageElement(file);
  let targetWidth = source.width;
  let targetHeight = source.height;

  const scale = Math.min(
    1,
    config.maxWidth / Math.max(1, source.width),
    config.maxHeight / Math.max(1, source.height),
  );

  if (scale < 1) {
    targetWidth = Math.max(1, Math.round(source.width * scale));
    targetHeight = Math.max(1, Math.round(source.height * scale));
  }

  let canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  let context = canvas.getContext("2d");

  if (!context) {
    return file;
  }

  context.drawImage(source, 0, 0, targetWidth, targetHeight);

  const qualitySteps = buildQualitySteps(config.quality);
  let blob = await canvasToBlob(canvas, config.outputType, qualitySteps[0]);

  for (const quality of qualitySteps) {
    if (!blob || blob.size > config.maxBytes) {
      blob = await canvasToBlob(canvas, config.outputType, quality);
    }
    if (blob && blob.size <= config.maxBytes) {
      break;
    }
  }

  while (blob && blob.size > config.maxBytes && canvas.width > 480 && canvas.height > 480) {
    const nextWidth = Math.max(480, Math.round(canvas.width * 0.85));
    const nextHeight = Math.max(480, Math.round(canvas.height * 0.85));
    const resizedCanvas = document.createElement("canvas");
    resizedCanvas.width = nextWidth;
    resizedCanvas.height = nextHeight;
    const resizedContext = resizedCanvas.getContext("2d");

    if (!resizedContext) {
      break;
    }

    resizedContext.drawImage(canvas, 0, 0, nextWidth, nextHeight);
    canvas = resizedCanvas;
    context = resizedContext;
    blob = await canvasToBlob(canvas, config.outputType, qualitySteps.at(-1) ?? 0.68);
  }

  if (!blob) {
    return file;
  }

  if (blob.size >= file.size) {
    return file;
  }

  const extension = config.outputType === "image/jpeg" ? "jpg" : "webp";
  const fileName = `${sanitizeBaseName(config.fileNameBase || file.name)}.${extension}`;

  return new File([blob], fileName, {
    type: config.outputType,
    lastModified: Date.now(),
  });
}

export async function fileToDataUrl(file: File) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
    reader.readAsDataURL(file);
  });
}

function buildQualitySteps(baseQuality: number) {
  const clamped = Math.min(0.92, Math.max(0.55, baseQuality));
  return [clamped, Math.max(0.72, clamped - 0.08), Math.max(0.64, clamped - 0.16)];
}

function sanitizeBaseName(value: string) {
  return (value || "image")
    .replace(/\.[^.]+$/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "image";
}

async function loadImageElement(file: File) {
  const objectUrl = URL.createObjectURL(file);

  try {
    if (typeof createImageBitmap === "function") {
      return await createImageBitmap(file);
    }

    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("No se pudo cargar la imagen."));
      image.src = objectUrl;
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: "image/webp" | "image/jpeg",
  quality: number,
) {
  return await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}
