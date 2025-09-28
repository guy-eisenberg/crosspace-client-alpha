import { cn } from "@/lib/utils";
import { ChatMessageMetadata } from "@/types";
import { SendIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Textarea } from "../ui/textarea";
import ChatMessage from "./ChatMessage";

export default function ChatContainer({
  userId,
  chat,
  onSend,
  ...rest
}: {
  userId: string;
  chat: ChatMessageMetadata[];
  onSend: (contents: string) => void;
} & React.HTMLAttributes<HTMLDivElement>) {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [inputBottomMargin, setInputBottomMargin] = useState(0);
  const [inputContent, setInputContent] = useState("");

  useEffect(() => {
    if (!inputRef.current || visualViewport == null) return;

    visualViewport.addEventListener("resize", () => {
      if (visualViewport == null) return;

      setInputBottomMargin(window.innerHeight - visualViewport.height);
    });
  }, []);

  return (
    <div
      {...rest}
      className={cn("flex min-h-0 flex-1 flex-col p-4 pt-0", rest.className)}
    >
      <div className="scrollbar-hide mb-2 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
        {chat.map((message) => (
          <ChatMessage
            message={message}
            type={message.from === userId ? "outgoing" : "incoming"}
            key={message.id}
          />
        ))}
      </div>
      <div
        className="flex gap-4"
        style={{ marginBottom: 16 + inputBottomMargin }}
      >
        <Textarea
          className="resize-none"
          value={inputContent}
          onChange={(e) => setInputContent(e.target.value)}
          ref={inputRef}
        />
        <button
          className={cn(
            "text-default-800 transition",
            inputContent.length === 0 ? "opacity-30" : "cursor-pointer",
          )}
          disabled={inputContent.length === 0}
          onClick={() => {
            onSend(inputContent);

            setInputContent("");
          }}
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
}
