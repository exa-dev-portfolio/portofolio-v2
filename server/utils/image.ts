import sharp from "sharp";
import { HttpError } from "~~/server/errors/HttpError";

export interface ImageProcessOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  fit?: "contain" | "cover" | "fill" | "inside" | "outside";
}

export interface ProcessedImageResult {
  data: Buffer;
  contentType: string;
  extension: string;
  width?: number;
  height?: number;
  size: number;
}

/**
 * Validates, optimizes, and converts any uploaded image buffer to WebP format.
 * Provides security against corrupted files, polyglot uploads, and large payloads.
 */
export async function processImageToWebP(
  inputBuffer: Buffer,
  options: ImageProcessOptions = {}
): Promise<ProcessedImageResult> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 85,
    fit = "inside",
  } = options;

  try {
    const pipeline = sharp(inputBuffer, { failOn: "error" });

    // Validate image metadata (dimensions & format)
    const metadata = await pipeline.metadata();
    if (!metadata.format) {
      throw new HttpError(400, "INVALID_IMAGE", "Uploaded file is not a supported image format");
    }

    // Resize while keeping aspect ratio, only downscale if larger than max dimensions
    pipeline.resize({
      width: maxWidth,
      height: maxHeight,
      fit,
      withoutEnlargement: true,
    });

    // Convert to webp with high efficiency and strip metadata
    pipeline.webp({
      quality,
      effort: 4,
    });

    const data = await pipeline.toBuffer();
    const processedMeta = await sharp(data).metadata();

    return {
      data,
      contentType: "image/webp",
      extension: "webp",
      width: processedMeta.width,
      height: processedMeta.height,
      size: data.length,
    };
  } catch (error: any) {
    if (error instanceof HttpError) throw error;
    console.error("Backend image processing error:", error);
    throw new HttpError(
      400,
      "IMAGE_PROCESSING_FAILED",
      "Failed to process image. Please ensure the file is a valid image (JPEG, PNG, WebP, GIF, AVIF, TIFF)."
    );
  }
}
