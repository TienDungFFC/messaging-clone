"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import useConversation from "@/hooks/useConversation";
import MessageBox from "./MessageBox";
import { useSocket } from "@/context/SocketContext";
import { Message, Conversation } from "@/types";
import { getCurrentUser } from "@/utils/auth";
import useOtherUser from "@/hooks/useOtherUser";
import conversationService from "@/services/conversationService";
interface BodyProps {
  initialMessages: Message[];
  conversation: Conversation;
}

const Body: React.FC<BodyProps> = ({ initialMessages, conversation }) => {
  const otherUser = useOtherUser(conversation);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState(initialMessages);
  const { conversationId } = useConversation();
  const { joinConversation, socket } = useSocket();
  const [typingUsers, setTypingUsers] = useState<Record<string, number>>({});
  const currentUser = getCurrentUser();
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

  // Scroll to bottom when entering conversation or receiving new messages
  useEffect(() => {
    bottomRef?.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);
  useEffect(() => {
    const handleScroll = () => {
      if (bottomRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = bottomRef.current;
        if (scrollHeight - scrollTop <= clientHeight) {
          const lastMessage = messages[messages.length - 1];
          const currentTime = new Date().toISOString();
          const lastMessageTime = lastMessage.createdAt;
          // Nếu thời gian hiện tại lớn hơn thời gian tin nhắn cuối, gọi API để đánh dấu "seen"
          markConversationAsSeen(conversationId);
          // if (new Date(currentTime) > new Date(lastMessageTime)) {
          //   markConversationAsSeen(conversationId);
          // }
        }
      }
    };

    bottomRef.current?.addEventListener("scroll", handleScroll);
    return () => {
      bottomRef.current?.removeEventListener("scroll", handleScroll);
    };
  }, [messages, conversationId]);

  const markConversationAsSeen = async (conversationId: string) => {
    try {
      const response = await conversationService.markConversationAsSeen(
        conversationId
      );
      if (response.success) {
        console.log("Conversation marked as seen");
        setMessages((prevMessages) =>
          prevMessages.map((message) =>
            message.conversationId === conversationId
              ? { ...message, isSeen: "true" }
              : message
          )
        );
      }
    } catch (error) {
      console.error("Error marking conversation as seen", error);
    }
  };

  // Lắng nghe tin nhắn mới
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

  return (
    <div className="flex-1 overflow-y-auto dark:bg-black" ref={bottomRef}>
      {messages.map((message, index) => (
        <MessageBox
          isLast={index === messages.length - 1}
          key={message.messageId}
          data={message}
          isSeen={message.isSeen}
          otherUser={otherUser?.name}
        />
      ))}
      <div className="pt-24" ref={bottomRef} />
      {Object.entries(typingUsers)
        .filter(([userId]) => userId !== currentUser?.id)
        .map(([userId]) => {
          const fakeMessage: Message = {
            messageId: `typing-${userId}`,
            content: "Đang nhập...",
            conversationId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            timestamp: new Date().toISOString(),
            messageType: "text",
            senderId: otherUser?.id ?? "unknown ID",
            senderName: otherUser?.name ?? "Unknown User",
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
