import { CHUNK_SIZE } from "@/constants";
import type { DirEntryMetadata, FileEntryMetadata } from "@/types";

export function getEntryTotalChunks(
  entry: FileEntryMetadata | DirEntryMetadata,
) {
  return Math.ceil(entry.size / CHUNK_SIZE);
}
