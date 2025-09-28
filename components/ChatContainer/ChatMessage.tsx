import { timeAgoLabel } from "@/lib/timeAgoLabel";
import { cn } from "@/lib/utils";
import { ChatMessageMetadata } from "@/types";

export default function ChatMessage({
  message,
  type,
  ...rest
}: {
  message: ChatMessageMetadata;
  type: "incoming" | "outgoing";
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex max-w-full",
        type === "incoming" ? "justify-start" : "justify-end",
      )}
    >
      <div className="flex max-w-4/5 items-end gap-2">
        <div
          {...rest}
          className={cn(
            "max-w-full rounded-lg px-3 py-2 text-sm break-words text-white",
            type === "incoming"
              ? "bg-secondary rounded-bl-none"
              : "bg-primary rounded-br-none",
            rest.className,
          )}
        >
          <p>{message.contents}</p>
          <p
            className={cn(
              "mt-1 text-[10px]",
              type === "incoming"
                ? "text-muted-foreground opacity-50"
                : "text-primary-50",
            )}
          >
            {timeAgoLabel(new Date(message.timestamp).getTime())}
          </p>
        </div>
      </div>
    </div>
  );
}
