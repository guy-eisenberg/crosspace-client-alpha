import { fileSizeLabel } from "@/lib/fileSizeLabel";
import { getTransferTotalSize } from "@/lib/getTransferTotalSize";
import { getTransferTransferredBytes } from "@/lib/getTransferTransferredBytes";
import type { TransferMetadata } from "@/types";
import { PauseIcon, PlayIcon, TrashIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import FileThumbnail from "../FileExplorer/FileThumbnail";
import FolderIcon from "../assets/FolderIcon";
import { Progress } from "../ui/progress";

export default function TransferCard({
  transfer,
  pauseTransfer,
  resumeTransfer,
  deleteTransfer,
}: {
  transfer: TransferMetadata;
  pauseTransfer: () => void;
  resumeTransfer: () => void;
  deleteTransfer: () => void;
}) {
  const [progress, setProgress] = useState(0);
  const [rate, setRate] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const UPDATE_RATE = 1;

    const transferTotalSize = getTransferTotalSize(transfer);

    let lastRateIntervalBytes = getTransferTransferredBytes(transfer);
    const updateInterval = setInterval(() => {
      const currentTransferedBytes = getTransferTransferredBytes(transfer);

      const progress = Math.floor(
        (currentTransferedBytes / transferTotalSize) * 100,
      );

      if (progress === 100) {
        setDone(true);
        clearInterval(updateInterval);
      }

      setProgress(
        Math.floor((currentTransferedBytes / transferTotalSize) * 100),
      );

      const rate =
        (currentTransferedBytes - lastRateIntervalBytes) * UPDATE_RATE;
      lastRateIntervalBytes = currentTransferedBytes;

      setRate(rate);
    }, 1000 / UPDATE_RATE);

    return () => {
      clearInterval(updateInterval);
    };
  }, [transfer]);

  const thumbnail = useMemo(() => {
    const transferEntries = Object.values(transfer.list).map(
      (item) => item.entry,
    );

    if (transferEntries.length === 1)
      return <FileThumbnail className="text-xs" entry={transferEntries[0]} />;
    else {
      return <FolderIcon filled={true} />;
    }
  }, [transfer.list]);

  return (
    <div className="flex gap-3" key={transfer.id}>
      <div className="flex h-12 w-12 justify-center">{thumbnail}</div>
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col">
            <div className="flex items-center justify-between gap-1">
              <span className="overflow-hidden text-xs font-semibold overflow-ellipsis whitespace-nowrap">
                {transfer.name}
              </span>
              {transfer.running && (
                <span className="text-xs font-black whitespace-nowrap">
                  {fileSizeLabel(rate)}/s
                </span>
              )}
            </div>
            <span className="text-default-500 text-[10px]">
              {fileSizeLabel(getTransferTotalSize(transfer))}
            </span>
          </div>
          <div className="flex gap-2">
            {!done && (
              <button
                onClick={() => {
                  if (transfer.running) pauseTransfer();
                  else resumeTransfer();
                }}
              >
                {transfer.running ? (
                  <PauseIcon className="h-4 w-4" />
                ) : (
                  <PlayIcon className="h-4 w-4" />
                )}
              </button>
            )}
            <button onClick={deleteTransfer}>
              <TrashIcon className="text-danger text-destructive h-4 w-4" />
            </button>
          </div>
        </div>
        <Progress value={progress} />
      </div>
    </div>
  );
}
