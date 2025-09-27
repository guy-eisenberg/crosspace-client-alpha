import { base64ToBlob } from "@/lib/base64ToBlob";
import { cn } from "@/lib/utils";
import type { DirEntryMetadata, FileEntryMetadata } from "@/types";
import FolderIcon from "../assets/FolderIcon";

export default function FileThumbnail({
  entry,
  className,
}: {
  entry: FileEntryMetadata | DirEntryMetadata;
  className?: string;
}) {
  const ext = entry.name.split(".").pop();

  let thumbnailUrl: string | undefined;
  if (entry.thumbnail)
    thumbnailUrl = URL.createObjectURL(base64ToBlob(entry.thumbnail));

  return thumbnailUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt="File Thumbnail"
      className={cn(className, "rounded-lg")}
      src={thumbnailUrl}
    />
  ) : entry.type === "dir" ? (
    <FolderIcon className={className} filled={entry.size > 0} />
  ) : (
    <FileIcon className={className} ext={ext || ""} />
  );
}

function FileIcon({
  ext,
  ...rest
}: { ext: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...rest} className={cn("relative h-full w-full", rest.className)}>
      <span className="text-primary absolute bottom-2 left-1/2 -translate-x-1/2 font-bold">
        {ext.toUpperCase()}
      </span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
        fill="none"
        viewBox="0 0 60 80"
      >
        <g clipPath="url(#a)">
          <path
            fill="url(#b)"
            d="M0 8a8 8 0 0 1 8-8h26l26 26v46a8 8 0 0 1-8 8H8a8 8 0 0 1-8-8z"
          ></path>

          <path
            fill="color(display-p3 .8633 .8868 .9204)"
            d="M40 26h20L34 0v20a6 6 0 0 0 6 6"
          ></path>
          <path
            stroke="#000"
            strokeOpacity="0.06"
            strokeWidth="2"
            d="M8 1h25.586L59 26.414V72a7 7 0 0 1-7 7H8a7 7 0 0 1-7-7V8a7 7 0 0 1 7-7Z"
          ></path>
        </g>
        <defs>
          <linearGradient
            id="b"
            x1="30"
            x2="30"
            y1="0"
            y2="80"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="color(display-p3 .9476 .9643 .9881)"></stop>
            <stop
              offset="1"
              stopColor="color(display-p3 .9301 .9467 .9705)"
            ></stop>
          </linearGradient>
          <clipPath id="a">
            <path fill="#fff" d="M0 0h60v80H0z"></path>
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}
