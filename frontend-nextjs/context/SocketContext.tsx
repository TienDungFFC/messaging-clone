"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";

// Use environment variable or fallback to localhost
const CHAT_SERVICE_URL =
  process.env.NEXT_PUBLIC_CHAT_SERVICE_URL || "http://localhost:3001";

type SocketContextType = {
  socket: Socket | null;
  isConnected: boolean;
  sendMessage: (
    conversationId: string,
    content: string,
    senderId: string,
    messageType?: string
  ) => void;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  sendTypingSignal: (conversationId: string) => void;
};

// Create the context with default values
const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  sendMessage: () => {},
  joinConversation: () => {},
  leaveConversation: () => {},
  sendTypingSignal: () => {},
});

// Custom hook to use the socket context
export const useSocket = () => useContext(SocketContext);

// Socket provider component
export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();
  useEffect(() => {
    if (!user) return; // Only connect if there's a user

    console.log("Initializing socket connection with user:", user.id);

    // Initialize socket connection
    const socketInstance = io(CHAT_SERVICE_URL, {
      autoConnect: true,
      reconnection: true,
      auth: {
        userId: user.id,
      },
      withCredentials: true,
      transports: ["websocket", "polling"] 
    });

    // Set up event listeners
    socketInstance.on("connect", () => {
      console.log("Socket connected with ID:", socketInstance.id);
      setIsConnected(true);

      // Emit user:connect event with user data
      socketInstance.emit("user:connect", {
        userId: user.id,
        email: user.email,
        name: user.name,
      });
    });

    socketInstance.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    });

    // Listen for user joining events
    socketInstance.on("user:joined", (data) => {
      console.log("User joined conversation:", data);
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
  const sendMessage = useCallback(
    (
      conversationId: string,
      message: string,
      senderId: string,
      messageType: string = "text"
    ) => {
      if (!socket || !isConnected || !user) return;

      const messageData = {
        conversationId,
        message,
        senderId,
        messageType,
        createdAt: new Date().toISOString(),
        sender: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.avatarUrl || null,
        },
      };

      console.log("Sending message:", messageData);
      socket.emit("message:send", messageData);
    },
    [socket, isConnected, user]
  );

  // Improved joinConversation function with better logging
  const joinConversation = useCallback(
    (conversationId: string) => {
      if (!socket || !isConnected) {
        console.warn(
          `Cannot join conversation ${conversationId}: Socket ${
            socket ? "not connected" : "not initialized"
          }`
        );
        return;
      }

      console.log(
        `Joining conversation: ${conversationId} with socket ID: ${socket.id}`
      );
      socket.emit("join:conversation", conversationId);

      // Provide confirmation
      socket.on(`joined:${conversationId}`, () => {
        console.log(`Successfully joined conversation: ${conversationId}`);
      });
    },
    [socket, isConnected]
  );

  const leaveConversation = useCallback(
    (conversationId: string) => {
      if (!socket || !isConnected) return;
      console.log("Leaving conversation:", conversationId);
      socket.emit("leave:conversation", conversationId);
    },
    [socket, isConnected]
  );

  const sendTypingSignal = useCallback(
    (conversationId: string) => {
      if (!socket || !isConnected || !user) return;
      socket.emit("typing", { 
        conversationId,
        userId: user.id,
        name: user.name  // Gửi tên người dùng khi typing
      });
    },
    [socket, isConnected, user]
  );

  const value = {
    socket,
    isConnected,
    sendMessage,
    joinConversation,
    leaveConversation,
    sendTypingSignal,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

// Export the context if needed elsewhere
export default SocketContext;
