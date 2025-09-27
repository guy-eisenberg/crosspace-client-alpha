import { indexed } from "@/clients/client/indexed";
import { CHUNK_SIZE, MAX_BUFFER_SIZE } from "@/constants";
import Dexie from "dexie";

export enum FileEvent {
  SaveFileChunksRequest = "CompressAndSaveRequest",
  SaveFileChunksResponse = "CompressAndSaveResponse",
  SaveFileChunkRequest = "SaveFileChunkRequest",
  SaveFileChunkResponse = "SaveFileChunkResponse",
  DeleteFilesRequest = "DeleteFilesRequest",
  DeleteFilesResponse = "DeleteFilesResponse",
}

self.onmessage = async (message) => {
  const { event, data } = message.data as { event: FileEvent; data: any };

  if (event === FileEvent.SaveFileChunksRequest) {
    const { requestId, spaceId, fileId, file } = data as {
      requestId: string;
      spaceId: string;
      fileId: string;
      file: File;
    };

    await saveFileChunks(spaceId, fileId, file);

    await indexed.spaces_files.update([spaceId, fileId], {
      updatedAt: new Date().getTime(),
      saveDone: true,
    });

    self.postMessage({
      event: FileEvent.SaveFileChunksResponse,
      data: { requestId },
    });
  } else if (event === FileEvent.SaveFileChunkRequest) {
    const { requestId, spaceId, fileId, index, chunk } = data as {
      requestId: string;
      spaceId: string;
      fileId: string;
      index: number;
      chunk: ArrayBuffer;
    };

    await indexed.spaces_files_chunks.put({
      spaceId,
      id: fileId,
      index,
      chunk,
    });

    self.postMessage({
      event: FileEvent.SaveFileChunkResponse,
      data: { requestId },
    });
  } else if (event === FileEvent.DeleteFilesRequest) {
    const { requestId, spaceId, fileIds } = data as {
      requestId: string;
      spaceId: string;
      fileIds: string[];
    };

    await deleteFiles(spaceId, fileIds);

    self.postMessage({
      event: FileEvent.DeleteFilesResponse,
      data: { requestId },
    });
  }
};

async function saveFileChunks(spaceId: string, fileId: string, file: File) {
  let pendingChunks: ArrayBuffer[] = [];
  let savedChunks = 0;

  for (let offset = 0; offset < file.size; offset += CHUNK_SIZE) {
    const end = Math.min(offset + CHUNK_SIZE, file.size);
    const slice = file.slice(offset, Math.min(offset + CHUNK_SIZE, file.size));
    const chunk = await slice.arrayBuffer();

    pendingChunks.push(chunk);

    if (end % MAX_BUFFER_SIZE === 0 || end === file.size) {
      await indexed.spaces_files_chunks.bulkAdd(
        pendingChunks.map((chunk, i) => ({
          spaceId,
          id: fileId,
          index: savedChunks + i,
          chunk,
        })),
      );

      savedChunks += pendingChunks.length;
      pendingChunks = [];
    }
  }
}

async function deleteFiles(spaceId: string, fileIds: string[]) {
  await Promise.all([
    indexed.spaces_files.bulkDelete(fileIds.map((fileId) => [spaceId, fileId])),
    Promise.all(
      fileIds.map((fileId) =>
        (async () => {
          await indexed.spaces_files_chunks
            .where("[spaceId+id]")
            .between(
              [spaceId, fileId, Dexie.minKey],
              [spaceId, fileId, Dexie.maxKey],
            )
            .delete();
        })(),
      ),
    ),
  ]);
}
