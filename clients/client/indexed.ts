import type {
  FileChunkIndexedMetadata,
  FileIndexedMetadata,
  SpaceKeysIndexedMetadata,
} from "@/types";
import Dexie, { type EntityTable, type Table } from "dexie";

export const indexed = new Dexie("db") as Dexie & {
  spaces_keys: EntityTable<SpaceKeysIndexedMetadata, "id">;
  spaces_files: Table<FileIndexedMetadata, [string, string]>;
  spaces_files_chunks: Table<
    FileChunkIndexedMetadata,
    [string, string, number]
  >;
};

indexed.version(1).stores({
  spaces_keys: "id",
  spaces_files: "[spaceId+id], [spaceId+path]",
  spaces_files_chunks: "[spaceId+id+index]",
});
