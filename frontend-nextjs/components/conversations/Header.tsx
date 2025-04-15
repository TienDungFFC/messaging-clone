"use client";

import { useMemo } from "react";
import { HiChevronLeft, HiEllipsisHorizontal } from "react-icons/hi2";
import Link from "next/link";
import { Conversation, User } from "@/types";
import useOtherUser from "@/hooks/useOtherUser";
import Avatar from "@/components/Avatar";
import ProfileDrawer from "./ProfileDrawer";
import { useState } from "react";
import AvatarGroup from "@/components/AvatarGroup";
import useActiveList from "@/hooks/useActiveList";

interface HeaderProps {
  conversation: Conversation;
}

const Header: React.FC<HeaderProps> = ({ conversation }) => {
  const otherUser = useOtherUser(conversation);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { members } = useActiveList();
  
  const isActive = members.indexOf(otherUser?.userId || '') !== -1;

  const statusText = useMemo(() => {
    if (conversation.type === 'group') {
      return `${conversation.participantIds.length} members`;
    }

    return isActive ? 'Active' : 'Offline';
  }, [conversation, isActive]);

  return (
    <>
      <ProfileDrawer 
        data={conversation} 
        isOpen={drawerOpen} 
        onClose={() => setDrawerOpen(false)}
      />
      <div className="
        bg-white 
        w-full 
        flex 
        border-b-[1px] 
        sm:px-4 
        py-3 
        px-4 
        lg:px-6 
        justify-between 
        items-center 
        shadow-sm
      ">
        <div className="flex gap-3 items-center">
          <Link
            href="/conversations" 
            className="
              lg:hidden 
              block 
              text-sky-500 
              hover:text-sky-600 
              transition 
              cursor-pointer
            "
          >
            <HiChevronLeft size={32} />
          </Link>
          {conversation.type === 'group' ? (
            <AvatarGroup users={conversation.participantIds.map(id => ({ userId: id }))} />
          ) : (
            <Avatar user={otherUser} />
          )}
          <div className="flex flex-col">
            <div>{conversation.name || otherUser?.name || 'Unknown'}</div>
            <div className="text-sm font-light text-neutral-500">
              {statusText}
            </div>
          </div>
        </div>
        <HiEllipsisHorizontal
          size={32}
          onClick={() => setDrawerOpen(true)}
          className="
            text-sky-500
            cursor-pointer
            hover:text-sky-600
            transition
          "
        />
      </div>
    </>
  );
}
 
export default Header;
