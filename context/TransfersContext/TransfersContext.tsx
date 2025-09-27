"use client";

import { indexed } from "@/clients/client/indexed";
import { CHUNK_SIZE } from "@/constants";
import { binarySearch } from "@/lib/binarySearch";
import { decodeBytesMessage } from "@/lib/decodeBytesMessage";
import { encodeBytesMessage } from "@/lib/encodeBytesMessage";
import { FileUtils } from "@/lib/FileUtils";
import { isTransferDone } from "@/lib/isTransferDone";
import type { FileEntryMetadata, TransferMetadata } from "@/types";
import Dexie from "dexie";
import { Zip, ZipPassThrough } from "fflate";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { v4 as uuid } from "uuid";
import { useRTC } from "../RTCContext/RTCContext";
import { useSW } from "../SWContext";
import { TransferEvent } from "./constants";

const TransfersContext = createContext<{
  incomingTransfers: {
    [id: string]: TransferMetadata;
  };
  outgoingTransfers: {
    [id: string]: TransferMetadata;
  };
  startTransfer: (
    name: string,
    basePath: string,
    entries: FileEntryMetadata[],
  ) => Promise<void>;
  pauseTransfer: (transferId: string) => Promise<void>;
  resumeTransfer: (transferId: string) => Promise<void>;
  deleteTransfer: (transferId: string) => Promise<void>;
}>({
  incomingTransfers: {},
  outgoingTransfers: {},
  startTransfer: function (): Promise<void> {
    throw new Error("Function not implemented.");
  },
  pauseTransfer: function (): Promise<void> {
    throw new Error("Function not implemented.");
  },
  resumeTransfer: function (): Promise<void> {
    throw new Error("Function not implemented.");
  },

  deleteTransfer: function (): Promise<void> {
    throw new Error("Function not implemented.");
  },
});

export function TransfersProvider({ children }: { children: React.ReactNode }) {
  const { createDownloadStream } = useSW();
  const { onRTCEvent, onRTCBytes, requestTunnels, releaseTunnels, send } =
    useRTC();

  const [incomingTransfers, setIncomingTransfers] = useState<{
    [id: string]: TransferMetadata;
  }>({});
  const [outgoingTransfers, setOutgoingTransfers] = useState<{
    [id: string]: TransferMetadata;
  }>({});

  const save = useCallback(
    async (entry: FileEntryMetadata) => {
      const stream = await createDownloadStream({
        name: entry.name,
        size: entry.size,
      });

      await indexed.spaces_files_chunks
        .where(["spaceId+id+index"])
        .between(
          [entry.spaceId, entry.id, Dexie.minKey],
          [entry.spaceId, entry.id, Dexie.maxKey],
        )
        .each(({ chunk }) => {
          stream.append(chunk);
        });

      stream.close();
    },
    [createDownloadStream],
  );

  const compressAndSave = useCallback(
    async (basePath: string, entries: FileEntryMetadata[]) => {
      const stream = await createDownloadStream({
        name: "download.zip",
        size: entries.reduce((sum, e) => sum + e.size, 0),
      });

      const zip = new Zip((err, data, final) => {
        if (err) throw err;

        stream.append(data.buffer as ArrayBuffer);

        if (final) stream.close();
      });

      for (const entry of entries) {
        const path = entry.path.replace(basePath, "");

        const zipEntry = new ZipPassThrough(path + entry.name);
        zip.add(zipEntry);

        await indexed.spaces_files_chunks
          .where(["spaceId+id+index"])
          .between(
            [entry.spaceId, entry.id, Dexie.minKey],
            [entry.spaceId, entry.id, Dexie.maxKey],
          )
          .each(({ chunk }) => {
            zipEntry.push(new Uint8Array(chunk));
          });

        zipEntry.push(new Uint8Array(0), true);
      }

      zip.end();
      zip.terminate();
    },
    [createDownloadStream],
  );

  const startTransfer = useCallback(
    async (name: string, basePath: string, entries: FileEntryMetadata[]) => {
      const transferId = uuid();
      const transfer: TransferMetadata = {
        id: transferId,
        name,
        basePath,
        peersIOIds: [],
        list: {},
        running: true,
      };

      const peersEntries: {
        [peerIOId: string]: TransferMetadata["list"];
      } = {};

      for (const entry of entries) {
        let bytesTransferred = 0;
        const existingIndexes: number[] = [];

        await indexed.spaces_files_chunks
          .where("[spaceId+id+index]")
          .between(
            [entry.spaceId, entry.id, Dexie.minKey],
            [entry.spaceId, entry.id, Dexie.maxKey],
          )
          .each((obj) => {
            existingIndexes.push(obj.index);

            bytesTransferred += obj.chunk.byteLength;
          });

        // If file does not fully exist on client, request it from origin peer:
        if (existingIndexes.length * CHUNK_SIZE < entry.size) {
          const peerIOId = entry.peerIOId;

          if (!peersEntries[peerIOId]) peersEntries[peerIOId] = {};
          peersEntries[peerIOId][entry.id] = {
            id: entry.id,
            entry,
            bytesTransferred,
            existingIndexes,
          };
        }

        transfer.list[entry.id] = {
          id: entry.id,
          entry,
          bytesTransferred,
          existingIndexes,
        };
      }

      if (Object.keys(peersEntries).length === 0) {
        const transferEntries = Object.values(transfer.list).map(
          (item) => item.entry,
        );

        if (transferEntries.length > 1)
          compressAndSave(transfer.basePath, transferEntries);
        else save(transferEntries[0]);

        return;
      }

      setIncomingTransfers((transfers) => ({
        ...transfers,
        [transferId]: transfer,
      }));

      await Promise.all(
        Object.entries(peersEntries).map(([peerIOId, entries]) =>
          (async () => {
            transfer.peersIOIds.push(peerIOId);

            await requestTunnels(peerIOId);

            await new Promise<void>(async (res) => {
              await send(peerIOId, {
                event: TransferEvent.NewTransfer,
                data: { id: transferId, name, basePath, list: entries },
              });

              const unsubscribe = onRTCEvent(
                TransferEvent.NewTransferAck,
                (ioId, data) => {
                  const { transferId: incomingTransferId } = data as {
                    transferId: string;
                  };

                  if (ioId === peerIOId && incomingTransferId === transferId) {
                    res();

                    unsubscribe();
                  }
                },
              );
            });
          })(),
        ),
      );
    },
    [requestTunnels, onRTCEvent, send, compressAndSave, save],
  );

  const pauseTransfer = useCallback(
    async (transferId: string) => {
      const transfer = incomingTransfers[transferId];
      transfer.running = false;

      await Promise.all(
        transfer.peersIOIds.map((peerIOId) =>
          (async () => {
            await send(peerIOId, {
              event: TransferEvent.TransferPause,
              data: { transferId },
            });

            return new Promise<void>((res) => {
              const unsubscribe = onRTCEvent(
                TransferEvent.TransferPauseAck,
                (ioId, data) => {
                  const { transferId: incomingTransferId } = data as {
                    transferId: string;
                  };

                  if (ioId === peerIOId && incomingTransferId === transferId) {
                    res();

                    unsubscribe();
                  }
                },
              );
            });
          })(),
        ),
      );

      setIncomingTransfers({ ...incomingTransfers });
    },
    [onRTCEvent, send, incomingTransfers],
  );

  const resumeTransfer = useCallback(
    async (transferId: string) => {
      const transfer = incomingTransfers[transferId];
      transfer.running = true;

      await Promise.all(
        transfer.peersIOIds.map((peerIOId) =>
          (async () => {
            await send(peerIOId, {
              event: TransferEvent.TrasnferResume,
              data: { transferId },
            });

            return new Promise<void>((res) => {
              const unsubscribe = onRTCEvent(
                TransferEvent.TrasnferResumeAck,
                (ioId, data) => {
                  const { transferId: incomingTransferId } = data as {
                    transferId: string;
                  };

                  if (ioId === peerIOId && incomingTransferId === transferId) {
                    res();

                    unsubscribe();
                  }
                },
              );
            });
          })(),
        ),
      );

      setIncomingTransfers({ ...incomingTransfers });
    },
    [onRTCEvent, send, incomingTransfers],
  );

  const deleteTransfer = useCallback(
    async (transferId: string) => {
      const transfer = incomingTransfers[transferId];
      transfer.running = false;

      await Promise.all(
        transfer.peersIOIds.map((peerIOId) =>
          (async () => {
            await send(peerIOId, {
              event: TransferEvent.TransferDelete,
              data: { transferId },
            });

            await new Promise<void>((res) => {
              const unsubscribe = onRTCEvent(
                TransferEvent.TransferDeleteAck,
                (ioId, data) => {
                  const { transferId: incomingTransferId } = data as {
                    transferId: string;
                  };

                  if (ioId === peerIOId && incomingTransferId === transferId) {
                    res();

                    unsubscribe();
                  }
                },
              );
            });

            await releaseTunnels(peerIOId);
          })(),
        ),
      );

      setIncomingTransfers((transfers) => {
        const updated = { ...transfers };

        delete updated[transferId];

        return updated;
      });
    },
    [onRTCEvent, send, releaseTunnels, incomingTransfers],
  );

  useEffect(() => {
    const newTransferInitUnsubscribe = onRTCEvent(
      TransferEvent.NewTransfer,
      async (peerIOId, data) => {
        const { id, name, basePath, list } = data as {
          id: string;
          name: string;
          basePath: string;
          list: TransferMetadata["list"];
        };

        const transfer: TransferMetadata = {
          id,
          name,
          basePath,
          peersIOIds: [peerIOId],
          list,
          running: true,
        };

        setOutgoingTransfers((transfers) => ({
          ...transfers,
          [transfer.id]: transfer,
        }));

        await send(peerIOId, {
          event: TransferEvent.NewTransferAck,
          data: { transferId: transfer.id },
        });
      },
    );

    return () => {
      newTransferInitUnsubscribe();
    };
  }, [onRTCEvent, send]);

  useEffect(() => {
    const transferDoneUnsubscribe = onRTCEvent(
      TransferEvent.TransferDone,
      async (ioId, data) => {
        const { transferId } = data as { transferId: string };

        const transfer = outgoingTransfers[transferId];
        transfer.running = false;

        await releaseTunnels(ioId);

        await send(ioId, {
          event: TransferEvent.TransferDoneAck,
          data: { transferId },
        });

        setOutgoingTransfers((transfers) => ({
          ...transfers,
          [transferId]: { ...transfers[transferId], running: false },
        }));
      },
    );

    const transferDeleteUnsubscribe = onRTCEvent(
      TransferEvent.TransferDelete,
      async (ioId, data) => {
        const { transferId } = data as { transferId: string };

        const transfer = outgoingTransfers[transferId];
        transfer.running = false;

        await releaseTunnels(ioId);

        await send(ioId, {
          event: TransferEvent.TransferDeleteAck,
          data: { transferId },
        });

        setOutgoingTransfers((transfers) => {
          const updated = { ...transfers };

          delete updated[transferId];

          return updated;
        });
      },
    );

    const transferPauseUnsubscribe = onRTCEvent(
      TransferEvent.TransferPause,
      async (ioId, data) => {
        const { transferId } = data as { transferId: string };

        const transfer = outgoingTransfers[transferId];
        transfer.running = false;

        await send(ioId, {
          event: TransferEvent.TransferPauseAck,
          data: { transferId },
        });

        setOutgoingTransfers((transfers) => ({ ...transfers }));
      },
    );

    const transferResumeUnsubscribe = onRTCEvent(
      TransferEvent.TrasnferResume,
      async (ioId, data) => {
        const { transferId } = data as { transferId: string };

        const transfer = outgoingTransfers[transferId];
        transfer.running = true;

        await send(ioId, {
          event: TransferEvent.TrasnferResumeAck,
          data: { transferId },
        });

        setOutgoingTransfers((transfers) => ({ ...transfers }));
      },
    );

    return () => {
      transferDoneUnsubscribe();
      transferPauseUnsubscribe();
      transferResumeUnsubscribe();
      transferDeleteUnsubscribe();
    };
  }, [onRTCEvent, releaseTunnels, send, outgoingTransfers]);

  useEffect(() => {
    const unsubscribe = onRTCBytes(async (_, data) => {
      const { buffer: chunk, metadata } = decodeBytesMessage({
        message: data,
        headers: {
          id: { start: 0, length: 36 },
          entryId: { start: 36, length: 36 },
          chunkIndex: { start: 72, length: 8 },
        },
      });

      const transfer = incomingTransfers[metadata.id];
      const entry = transfer.list[metadata.entryId];
      const chunkIndex = parseInt(metadata.chunkIndex, 16);

      await FileUtils.saveFileChunk(
        entry.entry.spaceId,
        entry.entry.id,
        chunkIndex,
        chunk,
      );

      entry.bytesTransferred += chunk.byteLength;
      entry.existingIndexes.push(chunkIndex);

      if (isTransferDone(transfer)) {
        await Promise.all(
          transfer.peersIOIds.map((peerIOId) =>
            (async () => {
              await send(peerIOId, {
                event: TransferEvent.TransferDone,
                data: { transferId: transfer.id },
              });

              await new Promise<void>((res) => {
                const unsubscribe = onRTCEvent(
                  TransferEvent.TransferDoneAck,
                  (ioId, data) => {
                    const { transferId: incomingTransferId } = data as {
                      transferId: string;
                    };

                    if (
                      ioId === peerIOId &&
                      incomingTransferId === transfer.id
                    ) {
                      res();

                      unsubscribe();
                    }
                  },
                );
              });

              await releaseTunnels(peerIOId);
            })(),
          ),
        );

        const transferItems = Object.values(transfer.list).map(
          (item) => item.entry,
        );
        if (transferItems.length === 1) await save(transferItems[0]);
        else await compressAndSave(transfer.basePath, transferItems);

        setIncomingTransfers((transfers) => ({
          ...transfers,
          [transfer.id]: { ...transfers[transfer.id], running: false },
        }));
      }
    });

    return () => {
      unsubscribe();
    };
  }, [
    onRTCBytes,
    onRTCEvent,
    releaseTunnels,
    send,
    save,
    compressAndSave,
    incomingTransfers,
  ]);

  useEffect(() => {
    transfersLoop();

    async function transfersLoop() {
      let activeTransfers: TransferMetadata[] = [];

      const entriesChunkIndexes: { [id: string]: number } = {};

      do {
        activeTransfers = getActiveTransfers();

        for (const transfer of activeTransfers) {
          const transferEntries = Object.values(transfer.list).filter(
            (item) => item.bytesTransferred < item.entry.size,
          );

          for (const entry of transferEntries) {
            const chunkIndex = entriesChunkIndexes[entry.id] ?? 0;

            if (binarySearch(entry.existingIndexes, chunkIndex)) {
              entriesChunkIndexes[entry.id] = chunkIndex + 1;

              continue;
            }

            const indexedChunk = await indexed.spaces_files_chunks.get([
              entry.entry.spaceId,
              entry.entry.id,
              chunkIndex,
            ]);
            if (!indexedChunk)
              throw new Error(
                `Could not find chunk of index ${chunkIndex} of entry "${entry.entry.id}"`,
              );

            const message = encodeBytesMessage({
              buffer: indexedChunk.chunk,
              headers: [
                transfer.id,
                entry.id,
                chunkIndex.toString(16).padStart(8, "0"),
              ],
            });

            await send(transfer.peersIOIds[0], message);

            entry.bytesTransferred += indexedChunk.chunk.byteLength;
            entry.existingIndexes.push(chunkIndex);

            entriesChunkIndexes[entry.id] = chunkIndex + 1;

            await new Promise((res) => setTimeout(res, 0));
          }
        }
      } while (activeTransfers.length > 0);
    }

    function getActiveTransfers() {
      return Object.values(outgoingTransfers).filter(
        (t) => t.running && !isTransferDone(t),
      );
    }
  }, [send, outgoingTransfers]);

  return (
    <TransfersContext.Provider
      value={{
        incomingTransfers,
        outgoingTransfers,
        startTransfer,
        pauseTransfer,
        resumeTransfer,
        deleteTransfer,
      }}
    >
      {children}
    </TransfersContext.Provider>
  );
}

export function useTransfers() {
  return useContext(TransfersContext);
}
