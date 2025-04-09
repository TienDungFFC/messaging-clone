import { useEffect } from "react";
import useActiveList from "./useActiveList";
import { socket } from "@/libs/socket";

const useActiveChannel = () => {
  const { set, add, remove } = useActiveList();

  useEffect(() => {
    // Connect to presence channel
    socket.emit('join:presence');

    // Handle initial members data
    socket.on('presence:init', (members: string[]) => {
      set(members);
    });

    // Handle member joining
    socket.on('presence:join', (memberId: string) => {
      add(memberId);
    });

    // Handle member leaving
    socket.on('presence:leave', (memberId: string) => {
      remove(memberId);
    });

    return () => {
      socket.off('presence:init');
      socket.off('presence:join');
      socket.off('presence:leave');
      socket.emit('leave:presence');
    };
  }, [set, add, remove]);
};

export default useActiveChannel;
