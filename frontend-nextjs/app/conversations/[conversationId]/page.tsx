"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import EmptyState from "@/components/EmptyState";
import Body from "@/components/conversations/Body";
import Form from "@/components/conversations/Form";
import Header from "@/components/conversations/Header";
import LoadingSpinner from "@/components/LoadingSpinner";
import conversationService from "@/services/conversationService";
import messageService from "@/services/messageService";
import { Conversation, Message } from "@/types";
import { useSocket } from "@/context/SocketContext";

export default function ConversationIdPage() {
  const params = useParams();
  const conversationId = params?.conversationId as string;
  const { socket, isConnected } = useSocket();
  
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [initialMessages, setInitialMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!conversationId) {
        setError("Invalid conversation ID");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // Fetch conversation details
        const convResult = await conversationService.getConversationById(conversationId);
        if (convResult.success && convResult.conversation) {
          setConversation(convResult.conversation);
          
          const msgResult = await messageService.getMessages(conversationId);
          if (msgResult.success && msgResult.messages) {
            const processedMessages: Message[] = msgResult.messages.map(msg => ({
              ...msg,
              senderAvatar: msg.senderAvatar || '/assets/placeholder.jpg',
              status: msg.status || 'sent'
            }));
            
            setInitialMessages(processedMessages);
          } else {
            console.warn("Could not fetch messages:", msgResult.message);
          }
        } else {
          setError(convResult.message || "Conversation not found");
        }
      } catch (err) {
        console.error("Error fetching conversation data:", err);
        setError("Failed to load conversation");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [conversationId]);

  // Log socket connection status
  useEffect(() => {
    if (conversationId) {
      console.log(`Socket connection status for conversation ${conversationId}: ${isConnected ? 'connected' : 'disconnected'}`);
    }
  }, [conversationId, isConnected]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="lg:pl-80 h-full flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Show error state
  if (error || !conversation) {
    return (
      <div className="lg:pl-80 h-full">
        <EmptyState />
      </div>
    );
  }

  // Show conversation
  return (
    <div className="lg:pl-80 h-full">
      <div className="h-full flex flex-col">
        <Header conversation={conversation} />
        <Body initialMessages={initialMessages} />
        <Form conversationId={conversationId} />
      </div>
    </div>
  );
}
