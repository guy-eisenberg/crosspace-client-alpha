import { ThumbnailGenerator } from "./ThumbnailGenerator";
import { blobToBase64 } from "./blobToBase64";

export async function generateFileThumbnail(file: File) {
  if (!ThumbnailGenerator.isFileSupported(file)) return undefined;

  const thumbnailGenerator = new ThumbnailGenerator();

  const blob = await thumbnailGenerator.generate(file);
  if (!blob) return undefined;

  return await blobToBase64(blob);
}
