import type { TransferMetadata } from "@/types";

export function getTransferTransferredBytes(transfer: TransferMetadata) {
  return Object.values(transfer.list).reduce(
    (sum, item) => sum + item.bytesTransferred,
    0,
  );
}
