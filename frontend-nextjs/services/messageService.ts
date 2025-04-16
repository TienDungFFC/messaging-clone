import { api } from '../utils/api';
import type { Message } from '../types';

/**
 * Get messages for a specific conversation
 * @param conversationId ID of the conversation to get messages for
 * @param limit Maximum number of messages to retrieve (default: 50)
 * @param nextPageKey Pagination key for fetching next page of messages
 * @returns Promise with the messages data
 */
export const getMessages = async (
  conversationId: string, 
  limit: number = 50,
  nextPageKey?: string
): Promise<{
  success: boolean;
  messages?: Message[];
  nextPageKey?: string;
  message?: string;
}> => {
  try {
    let url = `/api/conversations/${conversationId}/messages?limit=${limit}`;
    if (nextPageKey) {
      url += `&nextPageKey=${encodeURIComponent(nextPageKey)}`;
    }
    
    const response = await api.get(url);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Error fetching messages' 
    };
  }
};

/**
 * Send a new message in a conversation
 * @param conversationId ID of the conversation to send message to
 * @param content Content of the message
 * @param messageType Type of message (default: 'text')
 * @returns Promise with the sent message data
 */
export const sendMessage = async (
  conversationId: string, 
  content: string,
  messageType: string = 'text'
): Promise<{
  success: boolean;
  message?: any;
  error?: string;
}> => {
  try {
    const response = await api.post(`/api/conversations/${conversationId}/messages`, {
      content,
      messageType
    });
    
    return response.data;
  } catch (error: any) {
    console.error('Error sending message:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || 'Error sending message' 
    };
  }
};

/**
 * Mark a conversation as seen by the current user
 * FEATURE TEMPORARILY DISABLED
 */

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


// Export the service with all functions grouped
const messageService = {
  getMessages,
  sendMessage,
  markConversationAsSeen
};

export default messageService;
