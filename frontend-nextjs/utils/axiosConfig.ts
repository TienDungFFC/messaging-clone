import axios from 'axios';
import Cookies from 'js-cookie';

// Create base axios instance
export const createAPI = () => {
  const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  });

  api.interceptors.request.use(
    config => {
      const token = Cookies.get('auth-token');
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('Token found and added to request header');
      } else {
        const localToken = localStorage.getItem('auth-token-backup');
        if (localToken) {
          config.headers.Authorization = `Bearer ${localToken}`;
          console.log('Backup token found and added to request header');
        } else {
          console.warn('No authentication token found for API request');
        }
      }
      
      return config;
    },
    error => {
      console.error('Error in request interceptor:', error);
      return Promise.reject(error);
    }
  );

  return api;
};

// Create and export a singleton instance
export const api = createAPI();

export default api;
