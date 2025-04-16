"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import clsx from "clsx";
import Avatar from "./Avatar";
import useOtherUser from "@/hooks/useOtherUser";

interface ConversationBoxProps {
  data: any;
  selected?: boolean;
}

const ConversationBox: React.FC<ConversationBoxProps> = ({ data, selected }) => {
  const router = useRouter();

  const handleClick = useCallback(() => {
    router.push(`/conversations/${data.conversationId}`);
  }, [data.conversationId, router]);

  // Use the otherUser from the conversation data if available
  // or calculate it from participants
  const otherUser = data.otherUser || useOtherUser(data);

  const lastMessage = useMemo(() => {
    return data.lastMessagePreview || "Started a conversation";
  }, [data.lastMessagePreview]);

  const lastMessageDate = useMemo(() => {
    if (data.lastMessageAt) {
      return format(new Date(data.lastMessageAt), 'p');
    }

    return format(new Date(data.createdAt), 'p');
  }, [data.lastMessageAt, data.createdAt]);

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
        dark:hover:bg-neutral-800 
        rounded-lg
        transition
        cursor-pointer
        mb-2
      `,
        selected ? 'bg-neutral-100 dark:bg-neutral-800' : 'bg-white dark:bg-neutral-900'
      )}
    >
      <Avatar
        user={data.type === 'direct'
          ? { name: otherUser?.name, image: otherUser?.avatarUrl, type: 'direct' }
          : { name: data.name, image: null, type: 'group' }
        }
      />
      <div className="min-w-0 flex-1">
        <div className="focus:outline-none">
          <div className="flex justify-between items-center mb-1">
            <p className="text-md font-medium text-gray-900 dark:text-gray-100">
              {data.type === 'direct' ? otherUser?.name : data.name}
            </p>
            {data.lastMessageAt && (
              <p className="text-xs text-gray-400 dark:text-gray-500 font-light">
                {lastMessageDate}
              </p>
            )}
          </div>
          <p className={clsx(`
            truncate 
            text-sm
            `,
            data.lastMessagePreview ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400 dark:text-gray-500'
          )}>
            {lastMessage}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConversationBox;
