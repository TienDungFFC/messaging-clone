import axios, { AxiosRequestConfig } from 'axios';

// Chat service API URL
export const API_URL = process.env.NEXT_PUBLIC_CHAT_SERVICE_URL || 'http://localhost:3001';

// Create an axios instance with default config
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
export const withAuth = () => {
  const token = localStorage.getItem('authToken');
  
  return {
    get: (url: string, config?: AxiosRequestConfig) => {
      return api.get(url, {
        ...config,
        headers: {
          ...config?.headers,
          Authorization: `Bearer ${token}`,
        },
      });
    },
    post: (url: string, data?: any, config?: AxiosRequestConfig) => {
      return api.post(url, data, {
        ...config,
        headers: {
          ...config?.headers,
          Authorization: `Bearer ${token}`,
        },
      });
    },
    put: (url: string, data?: any, config?: AxiosRequestConfig) => {
      return api.put(url, data, {
        ...config,
        headers: {
          ...config?.headers,
          Authorization: `Bearer ${token}`,
        },
      });
    },
    delete: (url: string, config?: AxiosRequestConfig) => {
      return api.delete(url, {
        ...config,
        headers: {
          ...config?.headers,
          Authorization: `Bearer ${token}`,
        },
      });
    },
  };
};
