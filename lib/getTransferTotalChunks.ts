import type { TransferMetadata } from "@/types";
import { getEntryTotalChunks } from "./getEntryTotalChunks";

export function getTransferTotalChunks(transfer: TransferMetadata) {
  const transferItems = Object.values(transfer.list);

  return transferItems.reduce(
    (sum, entry) => sum + getEntryTotalChunks(entry.entry),
    0,
  );
}
