import axios from 'axios';
import { getAuthToken } from './cookies';

// Create a base API instance
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
});

// Add token to all API requests
api.interceptors.request.use(config => {
  const token = getAuthToken();
  console.log("token in api: ", token)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

// User-related API functions
export const userApi = {
  getAll: () => api.get('/users'),
  getById: (id: string) => api.get(`/users/${id}`),
  search: (query: string) => api.get(`/users/search?query=${query}`)
};

// Conversation-related API functions
export const conversationApi = {
  getAll: () => api.get('/conversations'),
  getById: (id: string) => api.get(`/conversations/${id}`),
  create: (data: any) => api.post('/conversations', data),
  addUser: (conversationId: string, userId: string) => 
    api.post(`/conversations/${conversationId}/users`, { userId })
};

// Message-related API functions
export const messageApi = {
  getByConversation: (conversationId: string) => 
    api.get(`/conversations/${conversationId}/messages`),
  send: (conversationId: string, content: string) => 
    api.post(`/conversations/${conversationId}/messages`, { content })
};

export default api;
