import { indexed } from "@/clients/client/indexed";
import type { FileIndexedMetadata } from "@/types";
import { FileEvent } from "@/workers/files-worker";
import { type UpdateSpec } from "dexie";
import { v4 as uuid } from "uuid";

export class FileUtils {
  static worker: Worker;

  private static initWorker() {
    if (!this.worker)
      this.worker = new Worker(
        new URL("@/workers/files-worker.ts", import.meta.url),
      );
  }

  static async deleteFiles(spaceId: string, fileIds: string[]) {
    this.initWorker();

    const requestId = uuid();
    this.worker.postMessage({
      event: FileEvent.DeleteFilesRequest,
      data: { requestId, spaceId, fileIds },
    });

    await new Promise<void>((res) => {
      const messageHandler = (message: MessageEvent) => {
        const { event, data } = message.data as {
          event: FileEvent;
          data: any;
        };

        if (
          event === FileEvent.DeleteFilesResponse &&
          data.requestId === requestId
        ) {
          res();

          this.worker.removeEventListener("message", messageHandler);
        }
      };

      this.worker.addEventListener("message", messageHandler);
    });
  }

  static async saveFileChunks(spaceId: string, fileId: string, file: File) {
    this.initWorker();

    const requestId = uuid();
    this.worker.postMessage({
      event: FileEvent.SaveFileChunksRequest,
      data: { requestId, spaceId, fileId, file },
    });

    await new Promise<void>((res) => {
      const messageHandler = (message: MessageEvent) => {
        const { event, data } = message.data as {
          event: FileEvent;
          data: { requestId: string } & any;
        };

        if (
          data.requestId === requestId &&
          event === FileEvent.SaveFileChunksResponse
        ) {
          res();

          this.worker.removeEventListener("message", messageHandler);
        }
      };

      this.worker.addEventListener("message", messageHandler);
    });
  }

  static async saveFileChunk(
    spaceId: string,
    fileId: string,
    index: number,
    chunk: ArrayBuffer,
  ) {
    this.initWorker();

    const requestId = uuid();
    this.worker.postMessage({
      event: FileEvent.SaveFileChunkRequest,
      data: { requestId, spaceId, fileId, index, chunk },
    });

    await new Promise<void>((res) => {
      const messageHandler = (message: MessageEvent) => {
        const { event, data } = message.data as {
          event: FileEvent;
          data: { requestId: string } & any;
        };

        if (
          event === FileEvent.SaveFileChunkResponse &&
          data.requestId === requestId
        ) {
          res();

          this.worker.removeEventListener("message", messageHandler);
        }
      };

      this.worker.addEventListener("message", messageHandler);
    });
  }

  static async getPathFiles(spaceId: string, path: string) {
    return await indexed.spaces_files
      .where("[spaceId+path]")
      .between([spaceId, path], [spaceId, path + "\uffff"])
      .toArray();
  }

  static async putFiles(files: FileIndexedMetadata[]) {
    await indexed.spaces_files.bulkPut(files);
  }

  static async updateFiles(
    updates: {
      spaceId: string;
      fileId: string;
      changes: UpdateSpec<FileIndexedMetadata>;
    }[],
  ) {
    await indexed.spaces_files.bulkUpdate(
      updates.map((update) => ({
        key: [update.spaceId, update.fileId],
        changes: update.changes,
      })),
    );
  }
}
