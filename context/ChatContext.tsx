"use client";

import type { ChatMessageMetadata } from "@/types";
import {
  createContext,
  type Dispatch,
  type SetStateAction,
  useCallback,
  useContext,
  useState,
} from "react";

const ChatContext = createContext<{
  chats: {
    [spaceId: string]: ChatMessageMetadata[];
  };
  addChatMessage: (spaceId: string, message: ChatMessageMetadata) => void;
  setChats: Dispatch<
    SetStateAction<{
      [spaceId: string]: ChatMessageMetadata[];
    }>
  >;
}>({
  chats: {},
  addChatMessage: function (): void {
    throw new Error("Function not implemented.");
  },
  setChats: function (): void {
    throw new Error("Function not implemented.");
  },
});

export default function ChatProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [chats, setChats] = useState<{
    [spaceId: string]: ChatMessageMetadata[];
  }>({});

  const addChatMessage = useCallback(
    (spaceId: string, message: ChatMessageMetadata) => {
      setChats((chats) => {
        let chat = chats[spaceId];
        if (!chat) {
          chat = [];
          chats[spaceId] = chat;
        }

        chat.push(message);
        chat.sort((m1, m2) => m1.timestamp - m2.timestamp);

        return { ...chats };
      });
    },
    [],
  );

  return (
    <ChatContext.Provider value={{ chats, addChatMessage, setChats }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  return useContext(ChatContext);
}
