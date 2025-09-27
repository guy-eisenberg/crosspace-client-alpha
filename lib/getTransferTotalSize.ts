import type { TransferMetadata } from "@/types";

export function getTransferTotalSize(transfer: TransferMetadata) {
  return Object.values(transfer.list).reduce(
    (sum, item) => sum + item.entry.size,
    0,
  );
}
