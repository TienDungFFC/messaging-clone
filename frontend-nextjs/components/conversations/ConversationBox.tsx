"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { User } from "@/types";
import Avatar from "@/components/Avatar";
import useOtherUser from "@/hooks/useOtherUser";
import clsx from "clsx";

interface ConversationBoxProps {
  data: any;
  selected?: boolean;
  currentUser: User | null;
}

const ConversationBox: React.FC<ConversationBoxProps> = ({ 
  data, 
  selected,
  currentUser
}) => {
  const router = useRouter();
  
  // For direct conversations, we want to show the other user
  const otherUser = data.type === 'direct' && data.otherUser 
    ? data.otherUser 
    : null;

  const lastMessageText = useMemo(() => {
    if (data.lastMessagePreview) {
      return data.lastMessagePreview;
    }

    return "Started a conversation";
  }, [data.lastMessagePreview]);

  const handleClick = useCallback(() => {
    router.push(`/conversations/${data.conversationId}`);
  }, [data.conversationId, router]);

  // Format the last message timestamp
  const lastMessageTime = useMemo(() => {
    if (data.lastMessageAt) {
      return format(new Date(data.lastMessageAt), 'p');
    }
    
    return format(new Date(data.createdAt), 'p');
  }, [data.lastMessageAt, data.createdAt]);

  // Determine the name to display
  const displayName = useMemo(() => {
    if (data.type === 'direct' && otherUser) {
      return otherUser.name;
    }
    
    return data.name || 'Unknown';
  }, [data.type, data.name, otherUser]);

  // Determine the avatar to display
  const avatarSrc = useMemo(() => {
    if (data.type === 'direct' && otherUser) {
      return otherUser.avatarUrl;
    }
    
    // For group conversations, we could use a default group avatar or the first participant's avatar
    return null;
  }, [data.type, otherUser]);

  return ( 
    <div
      onClick={handleClick}
      className={clsx(`
        w-full 
        relative 
        flex 
        items-center 
        space-x-3 
        p-3 
        hover:bg-neutral-100
        dark:hover:bg-gray-800
        rounded-lg
        transition
        cursor-pointer
        `,
        selected ? 'bg-neutral-100 dark:bg-gray-800' : 'bg-white dark:bg-gray-900'
      )}
    >
      <Avatar
        user={otherUser || { name: displayName, image: avatarSrc }}
      />
      <div className="min-w-0 flex-1">
        <div className="focus:outline-none">
          <div className="flex justify-between items-center mb-1">
            <p className="text-md font-medium text-gray-900 dark:text-gray-200">
              {displayName}
            </p>
            {data.lastMessageAt && (
              <p className="text-xs text-gray-400 font-light">
                {lastMessageTime}
              </p>
            )}
          </div>
          <p className={clsx(`
            truncate 
            text-sm
            `,
            data.lastMessagePreview ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400 dark:text-gray-500'
          )}>
            {lastMessageText}
          </p>
        </div>
      </div>
    </div>
  );
}
 
export default ConversationBox;
