import type { TransferMetadata } from "@/types";
import { type DialogProps } from "@radix-ui/react-dialog";
import MeerkatsIcon from "../assets/MeerkatsIcon";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import TransferCard from "./TransferCard";

export default function TransfersDialog({
  onOpenChange,
  transfers,
  onTransferPause,
  onTransferResume,
  onTransferDelete,
  ...rest
}: {
  transfers: TransferMetadata[];
  onTransferPause: (transferId: string) => void;
  onTransferResume: (transferId: string) => void;
  onTransferDelete: (transferId: string) => void;
} & DialogProps) {
  const description = (() => {
    switch (transfers.length) {
      case 0:
        return "There are currently no downloads.";
      default:
        return `There are ${transfers.length} downloads.`;
    }
  })();

  return (
    <Dialog {...rest} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Downloads</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {transfers.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-lg border border-dashed bg-[#fafafa] dark:bg-[#1a1a1a]">
            <MeerkatsIcon className="w-36" />
            <p className="text-sm">Your future downloads will appear here.</p>
          </div>
        ) : (
          <div className="flex min-w-0 flex-col gap-3 rounded-lg bg-[#fafafa] p-4 dark:bg-[#1a1a1a]">
            {transfers.map((transfer) => (
              <TransferCard
                transfer={transfer}
                pauseTransfer={() => onTransferPause(transfer.id)}
                resumeTransfer={() => onTransferResume(transfer.id)}
                deleteTransfer={() => onTransferDelete(transfer.id)}
                key={transfer.id}
              />
            ))}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="gray"
            onClick={() => {
              if (onOpenChange) onOpenChange(false);
            }}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
