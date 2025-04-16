import { useEffect, useState } from "react";
import { useSocket } from "@/context/SocketContext";

const usePresence = (userId: string | undefined) => {
  const { socket } = useSocket();
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    if (!socket || !userId) return;

    socket.emit("presence:check", userId, (isOnlineServer: boolean) => {
      setIsOnline(isOnlineServer);
    });
    const handleOnline = ({ userId: onlineId }: { userId: string }) => {
      if (onlineId === userId) setIsOnline(true);
    };

    const handleOffline = ({ userId: offlineId }: { userId: string }) => {
      if (offlineId === userId) setIsOnline(false);
    };

    socket.on("user:online", handleOnline);
    socket.on("user:offline", handleOffline);

    return () => {
      socket.off("user:online", handleOnline);
      socket.off("user:offline", handleOffline);
    };
  }, [socket, userId]);

  return isOnline;
};

export default usePresence;
