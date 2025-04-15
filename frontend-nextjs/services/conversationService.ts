import { api } from '../utils/api';
import type { Conversation, User } from '../types';

// Helper function to ensure conversation has a name
const ensureConversationName = (conversation: any, currentUserId?: string): Conversation => {
  // If it has a name already, return as is
  if (conversation.name) {
    return conversation as Conversation;
  }
  
  // For direct conversations, try to use other user's name
  if (conversation.type === 'direct' && conversation.otherUser?.name) {
    return {
      ...conversation,
      name: conversation.otherUser.name
    };
  }
  
  // For group conversations without a name
  if (conversation.type === 'group') {
    return {
      ...conversation,
      name: 'Group Conversation'
    };
  }
  
  // As a fallback, use a generic name
  return {
    ...conversation,
    name: 'Conversation'
  };
};

// Format conversations from API response
const formatConversations = (conversations: any[], currentUserId?: string): Conversation[] => {
  if (!conversations || !Array.isArray(conversations)) {
    return [];
  }
  
  return conversations.map(conv => ensureConversationName(conv, currentUserId));
};

/**
 * Get all conversations for the current user
 * @returns Promise with conversation data
 */
export const getConversations = async (): Promise<{
  success: boolean;
  conversations?: Conversation[];
  message?: string;
}> => {
  try {
    const response = await api.get('/api/conversations');
    
    if (response.data.success && response.data.conversations) {
      // Format conversations to ensure they have names
      const formattedConversations = formatConversations(response.data.conversations);
      
      return {
        ...response.data,
        conversations: formattedConversations
      };
    }
    
    return response.data;
  } catch (error: any) {
    console.error('Error fetching conversations:', error);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Error fetching conversations' 
    };
  }
};

/**
 * Get a specific conversation by ID
 * @param conversationId The ID of the conversation to fetch
 */
export const getConversationById = async (conversationId: string) => {
  try {
    const response = await api.get(`/api/conversations/${conversationId}`);
    
    if (response.data.success && response.data.conversation) {
      // Ensure the conversation has a name
      const formattedConversation = ensureConversationName(response.data.conversation);
      
      return {
        ...response.data,
        conversation: formattedConversation
      };
    }
    
    return response.data;
  } catch (error: any) {
    console.error('Error fetching conversation:', error);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Error fetching conversation' 
    };
  }
};

/**
 * Create a new conversation or find an existing direct conversation
 * @param participantIds Array of user IDs to include in the conversation
 * @param name Optional name for group chats
 * @param isGroup Whether this is a group conversation
 */
export const createOrFindConversation = async (
  participantIds: string[], 
  name?: string,
  isGroup: boolean = false
) => {
  try {
    const response = await api.post('/api/conversations', {
      participantIds,
      name,
      isGroup
    });
    
    return response.data;
  } catch (error: any) {
    console.error('Error creating conversation:', error);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Error creating conversation' 
    };
  }
};

/**
 * Mark a conversation as seen by the current user
 * @param conversationId The ID of the conversation to mark as seen
 * FEATURE TEMPORARILY DISABLED
 */
/*
export const markConversationAsSeen = async (conversationId: string) => {
  try {
    const response = await api.post(`/api/conversations/${conversationId}/seen`);
    return response.data;
  } catch (error: any) {
    console.error('Error marking conversation as seen:', error);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Error marking conversation as seen' 
    };
  }
};
*/

// Export the service with all functions grouped
const conversationService = {
  getConversations,
  getConversationById,
  createOrFindConversation,
  // markConversationAsSeen - temporarily disabled
};

export default conversationService;
