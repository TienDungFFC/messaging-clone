"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { find } from 'lodash';
import ConversationBox from "./ConversationBox";
import { usePathname } from "next/navigation";
import { MdOutlineGroupAdd } from 'react-icons/md';
import useConversation from "@/hooks/useConversation";
import { User } from "@/types";

interface ConversationListProps {
  initialItems: any[];
  currentUser: User | null;
}

const ConversationList: React.FC<ConversationListProps> = ({
  initialItems,
  currentUser
}) => {
  const [items, setItems] = useState(initialItems);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const { conversationId, isOpen } = useConversation();

  const handleCreateGroup = () => {
    setIsModalOpen(true);
  };

  // Update items when a new message comes in
  const updateItems = (newMessage: any) => {
    setItems(current => {
      const existingConversation = find(current, { conversationId: newMessage.conversationId });

      // If the conversation doesn't exist in our list, we might want to fetch it
      if (!existingConversation) {
        return current;
      }

      // Create a new array with the updated conversation
      return current.map(conversation => {
        if (conversation.conversationId === newMessage.conversationId) {
          return {
            ...conversation,
            lastMessagePreview: newMessage.content,
            lastMessageAt: newMessage.timestamp
          };
        }

        return conversation;
      }).sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
    });
  };

  useEffect(() => {
    // Listen for new messages to update the conversation list
    // This is where you would connect to a WebSocket or Event Source
    const handleNewMessage = (message: any) => {
      updateItems(message);
    };

    // Set up event listener for new messages
    // Example: socket.on('new-message', handleNewMessage);

    return () => {
      // Clean up event listener
      // Example: socket.off('new-message', handleNewMessage);
    };
  }, []);

  return (
    <aside className={`
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
      dark:border-gray-700
      ${isOpen ? 'hidden' : 'block w-full left-0'}
    `}>
      <div className="px-5">
        <div className="flex justify-between mb-4 pt-4">
          <div className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">
            Messages
          </div>
          <div
            onClick={handleCreateGroup}
            className="
              rounded-full 
              p-2 
              bg-gray-100 
              dark:bg-gray-800
              text-gray-600 
              dark:text-gray-300
              cursor-pointer 
              hover:opacity-75
              transition
            "
          >
            <MdOutlineGroupAdd size={20} />
          </div>
        </div>
        {items.map((item) => (
          <ConversationBox
            key={item.conversationId}
            data={item}
            selected={conversationId === item.conversationId}
            currentUser={currentUser}
          />
        ))}
      </div>
      {/* Group Chat Modal would go here */}
    </aside>
  );
};

export default ConversationList;
