"use client";

import ClientOnly from "@/components/ClientOnly";
import ConversationList from "@/components/ConversationList";
import Sidebar from "@/components/sidebar/Sidebar";
import { useEffect, useState } from "react";
import { Conversation, User } from "@/types";
import conversationService from "@/services/conversationService";
import userService from "@/services/userService";
import LoadingSpinner from "@/components/LoadingSpinner";
import { usePathname } from "next/navigation";

export default function ConversationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Fetch conversations
      const conversationsResult = await conversationService.getConversations();
      if (conversationsResult.success && conversationsResult.conversations) {
        setConversations(conversationsResult.conversations);
      }

      if (users.length === 0) {
        const usersResult = await userService.getAllUsers();
        if (usersResult.success && usersResult.users) {
          setUsers(usersResult.users);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      fetchData();
    }
  }, [pathname]);

  return (
    <Sidebar>
      <div className="h-full">
        <ClientOnly>
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <LoadingSpinner />
            </div>
          ) : (
            <ConversationList
              users={users}
              initialItems={conversations}
            />
          )}
        </ClientOnly>
        {children}
      </div>
    </Sidebar>
  );
}