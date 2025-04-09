import { useEffect, useState } from "react";
import { useSocket } from "@/context/SocketContext";
import { useQueryClient } from "@tanstack/react-query";

export interface Message {
  id?: string;
  body?: string;
  image?: string;
  senderId: string;
  conversationId: string;
  createdAt: string;
}

export default function useMessageListener(conversationId: string) {
  const { socket, joinConversation } = useSocket();
  const queryClient = useQueryClient();
  
  useEffect(() => {
    if (!socket || !conversationId) return;

    // Join conversation room
    joinConversation(conversationId);
    
    // Handle new messages
    const handleNewMessage = (message: Message) => {
      console.log("New message received:", message);
      
      // Update react-query cache to avoid extra fetch
      queryClient.setQueryData(['messages', conversationId], (oldData: any) => {
        if (!oldData?.pages?.length) return oldData;
        
        // Clone the first page and add the new message
        const newData = {...oldData};
        newData.pages[0] = [message, ...newData.pages[0]];
        
        return newData;
      });
      
      // Optionally update conversation list to show latest message
      queryClient.invalidateQueries(['conversations']);
    };
    
    // Listen for both event names to ensure compatibility
    socket.on("message:new", handleNewMessage);
    socket.on("messages:new", handleNewMessage);
    
    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("messages:new", handleNewMessage);
    };
  }, [socket, conversationId, joinConversation, queryClient]);
}