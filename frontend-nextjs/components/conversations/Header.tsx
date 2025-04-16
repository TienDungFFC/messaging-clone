"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { HiChevronLeft } from "react-icons/hi";
import { HiEllipsisHorizontal } from "react-icons/hi2";
import { Conversation, User } from "@/types";
import usePresence from "@/hooks/usePresence";

interface HeaderProps {
  conversation: Conversation;
}

// Placeholder for ProfileDrawer - you'll need to implement this
const ProfileDrawer = ({ isOpen, onClose, data }: any) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
      <div className="absolute right-0 h-full bg-white dark:bg-gray-900 w-full max-w-md p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500"
        >
          Close
        </button>
        <div className="mt-10">
          <h2 className="text-xl font-bold">Conversation Info</h2>
          {/* Add conversation details here */}
        </div>
      </div>
    </div>
  );
};

// Placeholder for AvatarGroup - you'll need to implement this
const AvatarGroup = ({ name }: { name: string }) => {
  return (
    <div className="relative h-9 w-9 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
      <span className="text-gray-600">
        {name?.charAt(0)?.toUpperCase() || "G"}
      </span>
    </div>
  );
};

// Placeholder for Avatar - you'll need to implement this
const Avatar = ({ user, isOnline }: { user: User; isOnline: boolean }) => {
  return (
    <div className="relative">
      <div className="relative h-9 w-9 rounded-full overflow-hidden">
        {user.avatarUrl ? (
          <Image fill src={user.avatarUrl} alt="Avatar" />
        ) : (
          <div className="h-full w-full bg-gray-300 flex items-center justify-center">
            <span className="text-gray-600">
              {user.name?.charAt(0)?.toUpperCase() || "?"}
            </span>
          </div>
        )}
      </div>
      {isOnline && (
        <span className="absolute block rounded-full bg-green-500 ring-2 ring-white top-0 right-0 h-2 w-2" />
      )}
    </div>
  );
};

const Header: React.FC<HeaderProps> = ({ conversation }) => {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isGroup = conversation.type === "group";
  const otherUser = conversation.otherUser || {
    id: "",
    name: "Unknown User",
    avatarUrl: "",
    isActive: false,
  };
  const isOnline = usePresence(otherUser.userId);
  console.log("other user id: ", otherUser.userId);
  console.log("isOnline: ", isOnline);
  const statusText = useMemo(() => {
    if (isGroup) return `${conversation.participantIds.length} Members`;
    return isOnline ? "Active" : "Offline";
  }, [isGroup, isOnline, conversation.participantIds.length]);

  return (
    <>
      <ProfileDrawer
        data={conversation}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
      <div className="bg-white dark:bg-black w-full flex border-b-[1px] dark:border-b-gray-600 sm:px-4 py-3 px-4 lg:px-6 justify-between items-center shadow-sm">
        <div className="flex gap-3 items-center">
          <Link
            href="/conversations"
            className="lg:hidden block text-sky-500 hover:text-sky-600 transition cursor-pointer"
          >
            <HiChevronLeft size={32} />
          </Link>
          {isGroup ? (
            <AvatarGroup name={conversation.name} />
          ) : (
            <Avatar user={otherUser} isOnline={isOnline} />
          )}
          <div className="flex flex-col">
            <div>{conversation.name || otherUser.name}</div>
            <div className="text-sm font-light text-neutral-500 dark:text-neutral-300">
              {statusText}
            </div>
          </div>
        </div>
        <HiEllipsisHorizontal
          size={32}
          onClick={() => setDrawerOpen(true)}
          className="text-sky-500 cursor-pointer hover:text-sky-600 transition"
        />
      </div>
    </>
  );
};

export default Header;
