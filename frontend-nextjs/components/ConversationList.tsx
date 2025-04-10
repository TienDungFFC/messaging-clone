"use client";

import useRoom from "@/hooks/useRoom"; 
import { socket } from "@/libs/socket";
import { FullRoomType } from "@/type"; // Updated type
import { User } from "@prisma/client";
import clsx from "clsx";
import { find } from "lodash";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { MdOutlineGroupAdd } from "react-icons/md";

import RoomBox from "./RoomBox"; // Renamed component
import GroupChatModal from "./model/GroupChatModal";

type Props = {
  initialItems: FullRoomType[];
  users: User[];
};

function ConversationList({ initialItems, users }: Props) {
  const router = useRouter();
  const session = useSession();
  const [items, setItems] = useState(initialItems);
  const [isModelOpen, setIsModelOpen] = useState(false);
  const { roomId, isOpen } = useRoom(); // Renamed from conversationId

  useEffect(() => {
    const newHandler = (room: FullRoomType) => {
      setItems((current) => {
        if (find(current, { id: room.id })) {
          return current;
        }

        return [room, ...current];
      });
    };

    const updateHandler = (room: FullRoomType) => {
      setItems((current) =>
        current.map((currentRoom) => {
          if (currentRoom.id === room.id) {
            return {
              ...currentRoom,
              messages: room.messages,
            };
          }

          return currentRoom;
        })
      );
    };

    const removeHandler = (room: FullRoomType) => {
      setItems((current) => {
        return [...current.filter((r) => r.id !== room.id)];
      });

      if (roomId === room.id) {
        router.push("/rooms");
      }
    };

    // Update event names from conversation:* to room:*
    socket.on("room:new", newHandler);
    socket.on("room:update", updateHandler);
    socket.on("room:remove", removeHandler);

    return () => {
      socket.off("room:new", newHandler);
      socket.off("room:update", updateHandler);
      socket.off("room:remove", removeHandler);
    };
  }, [router, roomId]);

  return (
    <>
      <GroupChatModal
        isOpen={isModelOpen}
        onClose={() => setIsModelOpen(false)}
        users={users}
      />
      <aside
        className={clsx(
          `fixed inset-y-0 pb-20 lg:pb-0 lg:left-20 lg:w-80 lg:block overflow-y-auto border-r border-gray-200 dark:border-gray-700 dark:bg-black`,
          isOpen ? "hidden" : "block w-full left-0"
        )}
      >
        <div className="px-5">
          <div className="flex justify-between mb-4 pt-4">
            <div className="text-2xl font-bold text-neutral-800 dark:text-neutral-200">
              Messages
            </div>
            <div
              onClick={() => setIsModelOpen(true)}
              className="rounded-full p-2 bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-400 cursor-pointer hover:opacity-75 transition"
            >
              <MdOutlineGroupAdd size={20} />
            </div>
          </div>
          {items.map((item) => (
            <RoomBox
              key={item.id}
              data={item}
              selected={roomId === item.id}
            />
          ))}
        </div>
      </aside>
    </>
  );
}

export default ConversationList;
