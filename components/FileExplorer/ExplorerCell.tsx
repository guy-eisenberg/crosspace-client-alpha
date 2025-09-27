import { fileSizeLabel } from "@/lib/fileSizeLabel";
import { timeAgoLabel } from "@/lib/timeAgoLabel";
import { cn } from "@/lib/utils";
import type { DirEntryMetadata, FileEntryMetadata } from "@/types";
import { EllipsisVerticalIcon } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Spinner } from "../ui/shadcn-io/spinner";
import FileThumbnail from "./FileThumbnail";

export default function ExplorerCell({
  entry,
  selected,
  deleteFile,
  renameFile,
  downloadFile,
  ...rest
}: {
  entry: FileEntryMetadata | DirEntryMetadata;
  selected: boolean;
  deleteFile: () => void;
  renameFile: () => void;
  downloadFile: () => void;
} & React.HTMLAttributes<HTMLDivElement>) {
  const ext = entry.name.split(".").pop();

  return (
    <div
      {...rest}
      className={cn(
        "group",
        entry.type === "file" && !entry.saveDone
          ? "pointer-events-none opacity-30"
          : "cursor-pointer opacity-100",
        rest.className,
      )}
    >
      <div
        className={cn(
          "group-hover:border-primary-100 relative mb-2 flex h-42 items-center justify-center overflow-hidden rounded-lg border p-2 transition",
          selected
            ? "border-primary-100 bg-primary-50/50"
            : `border-transparent`,
        )}
      >
        <FileThumbnail className="max-h-3/4 max-w-3/4" entry={entry} />
        <Checkbox
          className={cn(
            "absolute top-2 left-2 size-6 transition",
            selected ? "opacity-100" : "opacity-0",
          )}
          checked
        />
        {entry.type === "file" && !entry.saveDone && (
          <Spinner
            className="text-primary absolute top-2 left-1"
            variant="circle"
          />
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "absolute top-1 right-1 size-8 transition",
                selected ? "opacity-0!" : "opacity-100",
              )}
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
              }}
              disabled={selected}
            >
              <EllipsisVerticalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              className="cursor-pointer"
              disabled={entry.type === "file" && !entry.saveDone}
              onClick={(e) => {
                e.stopPropagation();

                downloadFile();
              }}
            >
              Download
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();

                renameFile();
              }}
            >
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              variant="destructive"
              onClick={(e) => {
                e.stopPropagation();

                deleteFile();
              }}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div
        className={cn(
          "mb-1 flex justify-between gap-2",
          entry.type === "dir" && "justify-center",
        )}
      >
        <span className="overflow-hidden overflow-ellipsis whitespace-nowrap">
          {entry.name}
        </span>
        {entry.type !== "dir" && (
          <Badge
            className="bg-secondary border-border border"
            variant="secondary"
          >
            {ext?.toUpperCase()}
          </Badge>
        )}
      </div>
      <div
        className={cn(
          "flex justify-between text-xs",
          entry.type === "dir" && "justify-center",
        )}
      >
        <div className="text-muted-foreground flex gap-1">
          <span>{timeAgoLabel(entry.createdAt)}</span>
          <span>•</span>
          <span>{fileSizeLabel(entry.size)}</span>
        </div>
      </div>
    </div>
  );
}
