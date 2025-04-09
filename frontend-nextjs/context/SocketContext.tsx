"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useSession } from "next-auth/react";

// Use environment variable or fallback to localhost
const CHAT_SERVICE_URL = process.env.NEXT_PUBLIC_CHAT_SERVICE_URL || 'http://localhost:3001';

type SocketContextType = {
  socket: Socket | null;
  isConnected: boolean;
  sendMessage: (conversationId: string, message: string, senderId: string) => void;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
};

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  sendMessage: () => {},
  joinConversation: () => {},
  leaveConversation: () => {},
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = io(CHAT_SERVICE_URL, {
      autoConnect: true,
      reconnection: true,
    });

    // Set up event listeners
    socketInstance.on("connect", () => {
      console.log("Socket connected");
      setIsConnected(true);
    });

    socketInstance.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    });

    socketInstance.on("error", (error) => {
      console.error("Socket error:", error);
    });

    socketInstance.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      console.log("Cleaning up socket connection");
      socketInstance.disconnect();
    };
  }, []);

  // Helper functions for common socket operations
  const sendMessage = useCallback((conversationId: string, message: string, senderId: string) => {
    if (!socket || !isConnected) return;
    
    // Get current user info from session
    const currentUser = session?.user;
    
    const messageData = {
      conversationId,
      message,
      senderId,
      createdAt: new Date().toISOString(),
      // Add sender information
      sender: {
        id: currentUser?.id || senderId,
        name: currentUser?.name || "Unknown User",
        email: currentUser?.email,
        image: currentUser?.image || null
      }
    };
    
    console.log("Sending message:", messageData);
    socket.emit("message:send", messageData);
  }, [socket, isConnected, session?.user]);

  const joinConversation = useCallback((conversationId: string) => {
    if (!socket || !isConnected) return;
    console.log("Joining conversation:", conversationId);
    socket.emit("join:conversation", conversationId);
  }, [socket, isConnected]);

  const leaveConversation = useCallback((conversationId: string) => {
    if (!socket || !isConnected) return;
    console.log("Leaving conversation:", conversationId);
    socket.emit("leave", conversationId);
  }, [socket, isConnected]);

  return (
    <SocketContext.Provider value={{ 
      socket, 
      isConnected, 
      sendMessage,
      joinConversation,
      leaveConversation
    }}>
      {children}
    </SocketContext.Provider>
  );
};