"use client";

import { User } from "@/types";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import Avatar from "./Avatar";
import LoadingSpinner from "./LoadingSpinner";
import { getAuthToken } from "@/utils/cookies";
import { getCurrentUser } from "@/utils/auth";

interface UserBoxProps {
  data: User;
}

const UserBox: React.FC<UserBoxProps> = ({ data }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // Get chat service base URL from env or use default
  const CHAT_SERVICE_URL = process.env.NEXT_PUBLIC_CHAT_SERVICE_URL || 'http://localhost:3001';
  
  const handleClick = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Get current user from token
      const currentUser = getCurrentUser();
      
      // Check if we're trying to message ourselves
      if (data.id === currentUser?.userId) {
        alert("You cannot start a conversation with yourself");
        setIsLoading(false);
        return;
      }
      
      // Get token from cookies
      const token = getAuthToken();
      
      if (!token) {
        alert("You must be logged in to start a conversation");
        return;
      }
      
      // Call chat service API directly
      const response = await axios.post(
        `${CHAT_SERVICE_URL}/api/conversations`,
        { participantIds: [data.id] },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        // Navigate to the conversation view
        router.push(`/conversations/${response.data.conversation.conversationId}`);
      } else {
        throw new Error(response.data.message || 'Failed to create conversation');
      }
    } catch (error: any) {
      console.error("Error creating conversation:", error);
      
      // Show more detailed error message
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Failed to create conversation';
      alert(`Error: ${errorMessage}`);
      
      // If unauthorized, redirect to login
      if (error.response?.status === 401) {
        console.log("error unauthorized");
      }
    } finally {
      setIsLoading(false);
    }
  }, [data, router, CHAT_SERVICE_URL]);
  
  // Rest of your component remains the same
  return (
    <div
      onClick={handleClick}
      className="w-full relative flex items-center space-x-3 p-3 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition cursor-pointer"
    >
      <Avatar user={data} />
      <div className="min-w-0 flex-1">
        <div className="focus:outline-none">
          <div className="flex justify-between items-center mb-1">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {data.name}
            </p>
          </div>
        </div>
      </div>
      {isLoading && (
        <div className="absolute right-4">
          <LoadingSpinner />
        </div>
      )}
    </div>
  );
};

export default UserBox;
