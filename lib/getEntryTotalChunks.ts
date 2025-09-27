import { CHUNK_SIZE } from "@/constants";
import type { FileEntryMetadata } from "@/types";

export function getEntryTotalChunks(entry: FileEntryMetadata) {
  return Math.ceil(entry.size / CHUNK_SIZE);
}
