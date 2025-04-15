import axios from 'axios';
import { Conversation, Message, User } from '@/types';

// API base URL
export const API_URL = `${process.env.NEXT_PUBLIC_CHAT_SERVICE_URL}/api` || 'http://localhost:3001/api';

// Create axios instance with auth header
const createAuthHeader = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` }
});

// User related API calls
export const getUserProfile = async (token: string): Promise<User | null> => {
  try {
    const response = await axios.get(`${API_URL}/users/profile`, createAuthHeader(token));
    return response.data.user;
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    return null;
  }
};

export const getUsers = async (token: string): Promise<User[]> => {
  try {
    const response = await axios.get(`${API_URL}/users`, createAuthHeader(token));
    return response.data.users;
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return [];
  }
};

// Conversation related API calls
export const getConversations = async (token: string): Promise<Conversation[]> => {
  try {
    const response = await axios.get(`${API_URL}/conversations`, createAuthHeader(token));
    return response.data.conversations;
  } catch (error) {
    console.error('Failed to fetch conversations:', error);
    return [];
  }
};

export const getConversationById = async (token: string, conversationId: string): Promise<Conversation | null> => {
  try {
    const response = await axios.get(`${API_URL}/conversations/${conversationId}`, createAuthHeader(token));
    return response.data.conversation;
  } catch (error) {
    console.error(`Failed to fetch conversation ${conversationId}:`, error);
    return null;
  }
};

export const createConversation = async (token: string, participants: string[], name?: string): Promise<Conversation | null> => {
  try {
    const response = await axios.post(
      `${API_URL}/conversations`, 
      { participants, name },
      createAuthHeader(token)
    );
    return response.data.conversation;
  } catch (error) {
    console.error('Failed to create conversation:', error);
    return null;
  }
};

// Message related API calls
export const getMessages = async (token: string, conversationId: string): Promise<Message[]> => {
  try {
    const response = await axios.get(
      `${API_URL}/conversations/${conversationId}/messages`,
      createAuthHeader(token)
    );
    return response.data.messages;
  } catch (error) {
    console.error(`Failed to fetch messages for conversation ${conversationId}:`, error);
    return [];
  }
};

export const sendMessage = async (
  token: string, 
  conversationId: string, 
  content: string, 
  messageType = 'text'
): Promise<Message | null> => {
  try {
    const response = await axios.post(
      `${API_URL}/conversations/${conversationId}/messages`,
      { content, messageType },
      createAuthHeader(token)
    );
    return response.data.message;
  } catch (error) {
    console.error('Failed to send message:', error);
    return null;
  }
};
