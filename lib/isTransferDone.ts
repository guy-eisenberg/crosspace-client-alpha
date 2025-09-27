import type { TransferMetadata } from "@/types";
import { getTransferChunksDone } from "./getTransferChunksDone";
import { getTransferTotalChunks } from "./getTransferTotalChunks";

export function isTransferDone(transfer: TransferMetadata) {
  const totalListChunks = getTransferTotalChunks(transfer);
  const chunksDone = getTransferChunksDone(transfer);

  return chunksDone >= totalListChunks;
}
