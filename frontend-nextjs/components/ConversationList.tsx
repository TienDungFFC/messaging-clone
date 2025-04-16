"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MdOutlineGroupAdd } from "react-icons/md";
import clsx from "clsx";

import useConversation from "@/hooks/useConversation";
import ConversationBox from "./ConversationBox";
import GroupChatModal from "./model/GroupChatModal";
import { User, Conversation } from "@/types";
import { useSession } from "@/hooks/useSession";
import conversationService from "@/services/conversationService";

interface ConversationListProps {
  initialItems: Conversation[];
  users: User[];
}

const ConversationList: React.FC<ConversationListProps> = ({
  initialItems,
  users,
}) => {
  const [items, setItems] = useState(initialItems);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const router = useRouter();
  const { conversationId, isOpen } = useConversation();
  const session = useSession();

  const conversations = useMemo(() => {
    if (!session?.user?.userId) return items;

    return items.filter((conversation) =>
      conversation.participantIds.includes(session.user?.userId ?? "")
    );
  }, [items, session?.user?.userId]);

  return (
    <>
      <GroupChatModal
        users={users}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
      <aside
        className={clsx(
          `
        fixed 
        inset-y-0 
        pb-20
        lg:pb-0
        lg:left-20 
        lg:w-80 
        lg:block
        overflow-y-auto 
        border-r 
        border-gray-200 
      `,
          isOpen ? "hidden" : "block w-full left-0"
        )}
      >
        <div className="px-5">
          <div className="flex justify-between mb-4 pt-4">
            <div className="text-2xl font-bold text-neutral-800">Messages</div>
            <div
              onClick={() => setIsModalOpen(true)}
              className="
                rounded-full 
                p-2 
                bg-gray-100 
                text-gray-600 
                cursor-pointer 
                hover:opacity-75 
                transition
              "
            >
              <MdOutlineGroupAdd size={20} />
            </div>
          </div>
          {conversations.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              Không có cuộc trò chuyện nào
            </div>
          ) : (
            conversations.map((item) => (
              <ConversationBox
                key={item.conversationId}
                data={item}
                selected={conversationId === item.conversationId}
              />
            ))
          )}
        </div>
      </aside>
    </>
  );
};

export default ConversationList;
