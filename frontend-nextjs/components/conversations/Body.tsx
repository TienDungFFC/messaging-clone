"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import messageService from "@/services/messageService";
import useConversation from "@/hooks/useConversation";
import MessageBox from "./MessageBox";
import { Message, User } from "@/types";
import { useSession } from "@/hooks/useSession";

interface BodyProps {
  initialMessages: Message[];
}

const Body: React.FC<BodyProps> = ({ initialMessages = [] }) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const { conversationId } = useConversation();
  const session = useSession();
  const currentUser = session.user as User;
  
  // Mark conversation as seen when component mounts
  // TEMPORARILY DISABLED
  /*
  useEffect(() => {
    if (!conversationId) return;
    
    // Mark the conversation as seen
    const markAsSeen = async () => {
      try {
        await messageService.markConversationAsSeen(conversationId);
      } catch (error) {
        console.error("Failed to mark conversation as seen:", error);
      }
    };
    
    markAsSeen();
  }, [conversationId]);
  */
  
  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef?.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // TODO: Socket.io connection for real-time messages
  useEffect(() => {
    // Here we would connect to socket.io and listen for new messages
    // For now, we'll just use the initial messages
    return () => {
      // Clean up socket connection
    };
  }, [conversationId]);
  
  return (
    <div className="flex-1 overflow-y-auto p-4">
      {messages.map((message, i) => (
        <MessageBox
          key={message.id || i}
          data={message}
          isOwn={message.senderId === currentUser?.userId}
        />
      ))}
      <div className="pt-24" ref={bottomRef} />
    </div>
  );
};

export default Body;
