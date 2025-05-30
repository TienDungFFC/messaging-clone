import { useMemo } from "react";
import { useSession } from "./useSession";
import { Conversation, User } from "@/types";

const useOtherUser = (conversation: Conversation | { participantIds: string[], type?: string }) => {
  const session = useSession();
  
  const otherUser = useMemo(() => {
    const currentUserUserId = session.user?.id;
    
    // Handle the case when there's no current user (not logged in)
    if ('otherUser' in conversation && conversation.otherUser) {
      return conversation.otherUser;
    }
    
    if (!currentUserUserId) {
      return {
        id: 'unknown',
        name: 'Unknown User',
        email: '',
      };
    }
    
    if (conversation.type === 'group') {
      return null;
    }
    
    // For direct conversations, find the other participant
    const otherParticipantId = conversation.participantIds.find(
      (participantId) => participantId !== currentUserUserId
    );
    
    // If the conversation already has otherUser information
    if ('otherUser' in conversation && conversation.otherUser) {
      return conversation.otherUser;
    }
    
    // If we don't have details, return a placeholder
    if (!otherParticipantId) {
      return {
        id: 'unknown',
        name: 'Unknown User',
        email: '',
      };
    }
    
    // Normally we would fetch user details here or from context
    // For now, we return a placeholder with the ID
    return {
      id: otherParticipantId,
      name: 'User ' + otherParticipantId.substring(0, 5),
      email: '',
    };
  }, [session.user?.id, conversation]);

  return otherUser;
};

export default useOtherUser;
