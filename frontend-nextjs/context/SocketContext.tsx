"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";

// Use environment variable or fallback to localhost
const CHAT_SERVICE_URL = process.env.NEXT_PUBLIC_CHAT_SERVICE_URL || 'http://localhost:3001';

type SocketContextType = {
  socket: Socket | null;
  isConnected: boolean;
  sendMessage: (conversationId: string, message: string, senderId: string) => void;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
};

// Create the context with default values
const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  sendMessage: () => {},
  joinConversation: () => {},
  leaveConversation: () => {},
});

// Custom hook to use the socket context
export const useSocket = () => useContext(SocketContext);

// Socket provider component
export const SocketProvider = ({ 
  children 
}: { 
  children: React.ReactNode 
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return; // Only connect if there's a user
    
    // Initialize socket connection
    const socketInstance = io(CHAT_SERVICE_URL, {
      autoConnect: true,
      reconnection: true,
      auth: {
        userId: user.userId
      }
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
  }, [user]);

  // Helper functions for common socket operations
  const sendMessage = useCallback((conversationId: string, message: string, senderId: string) => {
    if (!socket || !isConnected) return;
    
    const messageData = {
      conversationId,
      message,
      senderId,
      createdAt: new Date().toISOString(),
      // Add sender information
      sender: {
        id: user?.userId || senderId,
        name: user?.name || "Unknown User",
        email: user?.email || "",
        image: user?.avatarUrl || null
      }
    };
    
    console.log("Sending message:", messageData);
    socket.emit("message:send", messageData);
  }, [socket, isConnected, user]);

  const joinConversation = useCallback((conversationId: string) => {
    if (!socket || !isConnected) return;
    console.log("Joining conversation:", conversationId);
    socket.emit("join:conversation", conversationId);
  }, [socket, isConnected]);

  const leaveConversation = useCallback((conversationId: string) => {
    if (!socket || !isConnected) return;
    console.log("Leaving conversation:", conversationId);
    socket.emit("leave:conversation", conversationId);
  }, [socket, isConnected]);

  const value = {
    socket, 
    isConnected, 
    sendMessage,
    joinConversation,
    leaveConversation
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

// Export the context if needed elsewhere
export default SocketContext;