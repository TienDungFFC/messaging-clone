import { useEffect, useState } from "react";
import { useSocket } from "@/context/SocketContext";

type TypingUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
};

export function useTypingUsers(conversationId: string) {
  const { socket } = useSocket();
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

  useEffect(() => {
    if (!socket || !conversationId) return;

    const handleTyping = (data: {
      userId: string;
      name: string;
      email: string;
      image: string | null;
      conversationId?: string;
    }) => {
      const { userId, name, email, image } = data;
    
      setTypingUsers((prev) =>
        prev.some((u) => u.id === userId)
          ? prev
          : [...prev, { id: userId, name, email, image }]
      );
    };
    

    const handleStopTyping = ({ userId }: { userId: string }) => {
      console.log("RECEIVED stop:typing", userId);
      setTypingUsers((prev) => {
        const next = prev.filter((u) => u.id !== userId);
        console.log("Updated typingUsers:", next);
        return next;
      });
    };
    

    socket.on("user:typing", handleTyping);
    socket.on("user:stop:typing", handleStopTyping);

    return () => {
      socket.off("user:typing", handleTyping);
      socket.off("user:stop:typing", handleStopTyping);
    };
  }, [socket, conversationId]);

  useEffect(() => {
    setTypingUsers([]);
  }, [conversationId]);

  return typingUsers;
}
