import { cn } from "@/lib/utils";
import BackFolderIcon from "../assets/BackFolderIcon";

export default function BackExplorerCell({
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...rest} className={cn("group cursor-pointer", rest.className)}>
      <div className="group-hover:border-primary-100 relative mb-2 flex h-42 items-center justify-center overflow-hidden rounded-lg border border-transparent p-2 transition">
        <BackFolderIcon className="max-h-3/4 max-w-3/4" />
      </div>
      <div className="mb-1 flex justify-center gap-2">
        <span className="overflow-hidden overflow-ellipsis whitespace-nowrap">
          ...
        </span>
      </div>
    </div>
  );
}
