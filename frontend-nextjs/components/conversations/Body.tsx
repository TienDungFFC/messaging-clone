"use client";

import useConversation from "@/hooks/useConversation";
import { socket } from "@/libs/socket";
import { FullMessageType } from "@/type";
import axios from "axios";
import { find } from "lodash";
import { useEffect, useRef, useState } from "react";
import MessageBox from "./MessageBox";
import { useSession } from "next-auth/react";
import { useTypingUsers } from "@/hooks/useTypingUsers";

type Props = {
  initialMessages: FullMessageType[];
};

function Body({ initialMessages }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState(initialMessages);
  const { conversationId } = useConversation();
  const { data: session } = useSession();
  const currentUser = session?.user;
  const typingUsers = useTypingUsers(conversationId);

  useEffect(() => {
    socket.emit("join:conversation", conversationId);
    axios.post(`/api/conversations/${conversationId}/seen`);

    const handleNewMessage = (message: FullMessageType) => {
      console.log("message handler: ", message);

      // Đảm bảo message có đầy đủ thông tin sender

      if (!find(messages, { id: message.id })) {
        setMessages((prev) => [...prev, message]);
      }
      scrollToBottom();
    };

    const handleUpdateMessage = (updated: FullMessageType) => {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === updated.id ? updated : msg))
      );
    };

    socket.on("messages:new", handleNewMessage);
    socket.on("message:update", handleUpdateMessage);

    return () => {
      socket.emit("leave:conversation", conversationId);
      socket.off("messages:new", handleNewMessage);
      socket.off("message:update", handleUpdateMessage);
    };
  }, [conversationId, currentUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    bottomRef?.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex-1 overflow-y-auto dark:bg-black">
      {messages.map((message, index) => (
        <MessageBox
          isLast={index === messages.length - 1}
          key={message.id ?? `fallback-${index}`}
          data={message}
        />
      ))}

      {typingUsers
        .filter((u) => u.id !== currentUser?.id)
        .map((u) => {
          const fakeMessage: FullMessageType = {
            id: `typing-${u.id}`,
            body: "Đang nhập...",
            createdAt: new Date(),
            image: null,
            senderId: u.id,
            sender: u as any,
            seen: [],
            conversationId,
          };
          return (
            <MessageBox
              key={fakeMessage.id}
              data={fakeMessage}
              isTyping={true}
              isLast={false}
            />
          );
        })}

      <div ref={bottomRef} className="pt-24" />
    </div>
  );
}

export default Body;
