import type { TransferMetadata } from "@/types";

export function getTransferChunksDone(transfer: TransferMetadata) {
  const transferItems = Object.values(transfer.list);

  return transferItems.reduce(
    (sum, entry) => sum + entry.existingIndexes.length,
    0,
  );
}
