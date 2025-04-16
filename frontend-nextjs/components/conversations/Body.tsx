"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import useConversation from "@/hooks/useConversation";
import MessageBox from "./MessageBox";
import { useSocket } from "@/context/SocketContext";
import { Message } from "@/types";
import { getCurrentUser } from "@/utils/auth";
interface BodyProps {
  initialMessages: Message[];
}

const Body: React.FC<BodyProps> = ({ initialMessages }) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState(initialMessages);
  const { conversationId } = useConversation();
  const { joinConversation, socket } = useSocket();
  const [typingUsers, setTypingUsers] = useState<Record<string, number>>({});
  const currentUser = getCurrentUser();
  console.log("currentUser: ", currentUser);
  useEffect(() => {
    if (!socket || !conversationId) return;

    const handleTyping = ({
      conversationId: cid,
      userId,
      name,
    }: {
      conversationId: string;
      userId: string;
      name: string;
    }) => {
      console.log("user typing:", userId);
      if (cid !== conversationId) return;

      setTypingUsers((prev) => ({
        ...prev,
        [userId]: Date.now(),
      }));

      setTimeout(() => {
        setTypingUsers((prev) => {
          const updated = { ...prev };
          if (Date.now() - updated[userId] >= 3000) {
            delete updated[userId];
          }
          return updated;
        });
      }, 3000);
    };

    socket.on("user:typing", handleTyping);
    return () => {
      socket.off("user:typing", handleTyping);
    };
  }, [socket, conversationId]);

  // Join conversation via socket when mounted
  useEffect(() => {
    if (conversationId && socket) {
      console.log(`Joining conversation: ${conversationId}`);
      joinConversation(conversationId);
    }
  }, [conversationId, joinConversation, socket]);

  // Mark messages as seen when conversation is opened
  useEffect(() => {
    if (!conversationId) return;

    axios.post(`/api/conversations/${conversationId}/seen`).catch((error) => {
      console.error("Error marking conversation as seen:", error);
    });
  }, [conversationId]);

  // Listen for new messages from socket
  useEffect(() => {
    if (!socket || !conversationId) return;

    const handleNewMessage = (newMessage: Message) => {
      if (newMessage.conversationId === conversationId) {
        setMessages((prev) => [...prev, newMessage]);
      }
    };

    socket.on("message:new", handleNewMessage);

    return () => {
      socket.off("message:new", handleNewMessage);
    };
  }, [socket, conversationId]);

  // Scroll to bottom when entering conversation or receiving new messages
  useEffect(() => {
    bottomRef?.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);
  console.log("typingUsers map:", typingUsers);

  return (
    <div className="flex-1 overflow-y-auto dark:bg-black">
      {messages.map((message, index) => (
        <MessageBox
          isLast={index === messages.length - 1}
          key={message.messageId}
          data={message}
        />
      ))}
      <div className="pt-24" ref={bottomRef} />
      {Object.entries(typingUsers)
        .filter(([userId]) => userId !== currentUser?.userId)
        .map(([userId]) => {
          const fakeMessage: Message = {
            messageId: `typing-${userId}`,
            content: "Đang nhập...",
            conversationId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            timestamp: new Date().toISOString(),
            messageType: "text",
            senderId: userId,
            senderName: currentUser?.name ?? "Unknown User",
            senderAvatar: "/assets/placeholder.jpg",
            status: "pending",
          };

          return (
            <MessageBox
              key={fakeMessage.messageId}
              data={fakeMessage}
              isTyping={true}
            />
          );
        })}
    </div>
  );
};

export default Body;
