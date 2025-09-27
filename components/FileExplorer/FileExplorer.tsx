"use client";

import { cn } from "@/lib/utils";
import type { DirEntryMetadata, FileEntryMetadata } from "@/types";
import { useLayoutEffect, useRef, useState } from "react";
import BackExplorerCell from "./BackExplorerCell";
import ExplorerCell from "./ExplorerCell";

export default function FileExplorer({
  path,
  onPathChange,
  entries,
  selectedEntryIds,
  onEntriesSelectChange,
  onEntryDelete,
  onEntryRename,
  onEntryDownload,
  ...rest
}: {
  path: string;
  onPathChange: (path: string) => void;
  entries: (FileEntryMetadata | DirEntryMetadata)[];
  selectedEntryIds: { [id: string]: true };
  onEntriesSelectChange: (entryId: string) => void;
  onEntryDelete: (entryId: string) => void;
  onEntryRename: (entryId: string) => void;
  onEntryDownload: (entryId: string) => void;
} & React.HTMLAttributes<HTMLDivElement>) {
  const gridRef = useRef<HTMLDivElement>(null);

  const [colsCount, setColsCount] = useState(1);

  useLayoutEffect(() => {
    checkGrid();

    window.addEventListener("resize", checkGrid);

    function checkGrid() {
      if (!gridRef.current) return;

      const gridWidth = gridRef.current.clientWidth;

      const maxCellsPerRow = Math.floor(
        (gridWidth + GRID_GAP) / (CELL_MIN_WIDTH + GRID_GAP),
      );

      setColsCount(maxCellsPerRow);
    }

    return () => {
      window.removeEventListener("resize", checkGrid);
    };
  }, []);

  return (
    <div
      {...rest}
      className={cn("grid max-h-full", rest.className)}
      style={{
        gap: GRID_GAP,
        gridTemplateColumns: `repeat(${colsCount}, minmax(0, 1fr))`,
      }}
      ref={gridRef}
    >
      {path !== "/" && <BackExplorerCell onDoubleClick={goBack} />}
      {entries.map((entry) => {
        return (
          <ExplorerCell
            entry={entry}
            selected={selectedEntryIds[entry.id]}
            deleteFile={() => onEntryDelete(entry.id)}
            renameFile={() => onEntryRename(entry.id)}
            downloadFile={() => onEntryDownload(entry.id)}
            key={entry.id}
            onClick={(e) => {
              e.stopPropagation();

              onEntriesSelectChange(entry.id);
            }}
            onDoubleClick={() => {
              if (entry.type === "dir") {
                onPathChange(path + entry.name + "/");
              }
            }}
          />
        );
      })}
    </div>
  );

  function goBack() {
    const cleaned =
      path.endsWith("/") && path !== "/" ? path.slice(0, -1) : path;

    const lastSlash = cleaned.lastIndexOf("/");

    if (lastSlash <= 0) onPathChange("/");

    onPathChange(cleaned.slice(0, lastSlash + 1));
  }
}

const GRID_GAP = 16;
const CELL_MIN_WIDTH = 150;
