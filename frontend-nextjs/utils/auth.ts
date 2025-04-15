import axios from 'axios';
import { getAuthToken as getCookieToken, setAuthToken as setCookieToken, removeAuthToken as removeCookieToken } from './cookies';
import { api } from './axiosConfig';

// Export API từ axiosConfig để sử dụng
export { api };

// Constants for localStorage keys
export const USER_DATA_KEY = 'user-data';

// Type definitions
export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  lastSeen?: string;
}

/**
 * Get authentication token from cookies with better error handling
 * @returns {string|undefined} The authentication token or undefined if not found
 */
export const getAuthToken = (): string | undefined => {
  try {
    const token = getCookieToken();
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return undefined;
  }
};

/**
 * Set authentication token with improved logging
 * @param token JWT token to store
 * @param expiryDays Number of days until cookie expires
 */
export const setAuthToken = (token: string, expiryDays = 7): void => {
  try {
    if (!token) {
      console.error('Attempted to set empty/null token');
      return;
    }
    setCookieToken(token, expiryDays);
    console.log('Token set successfully in auth.ts');
  } catch (error) {
    console.error('Error setting auth token:', error);
  }
};

/**
 * Remove authentication token
 */
export const removeAuthToken = (): void => {
  try {
    removeCookieToken();
  } catch (error) {
    console.error('Error removing auth token:', error);
  }
};

/**
 * Parse JWT token to get user data
 * @param token JWT token
 * @returns User object from token payload or null
 */
export const getUserFromToken = (token: string): User | null => {
  try {
    if (!token) return null;
    
    // Get the payload part of the JWT
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(window.atob(base64));
    
    return {
      id: payload.id,
      email: payload.email,
      name: payload.name || '',
      // Other properties can be added if they're included in the JWT
    };
  } catch (error) {
    console.error('Error parsing token:', error);
    return null;
  }
};

/**
 * Set current user information in localStorage
 * @param user The user object to store
 */
export const setCurrentUser = (user: User): void => {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.setItem('user', JSON.stringify(user));
  } catch (error) {
    console.error('Error storing user data in localStorage:', error);
  }
};

/**
 * Get current user from token
 * @returns User object or null
 */
export const getCurrentUser = (): User | null => {
  const token = getAuthToken();
  if (!token) return null;
  
  // First try to get user from localStorage
  const storedUser = getUserData();
  if (storedUser) return storedUser;
  
  // If not found in localStorage, parse from token
  return getUserFromToken(token);
};

/**
 * Login function that handles token storage
 * @param email User email
 * @param password User password
 * @returns Promise with login result
 */
export const login = async (email: string, password: string) => {
  try {
    // Sử dụng axios trực tiếp cho API đăng nhập (tránh xác thực ban đầu)
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/login`, 
      { email, password },
      { withCredentials: true }
    );
    
    if (response.data.success) {
      // Lưu token
      const authToken = response.data.token;
      console.log('Login successful, got token');
      setAuthToken(authToken);
      
      // Lưu user data
      setUserData(response.data.user);
      
      return { 
        success: true, 
        user: response.data.user,
        token: authToken
      };
    }
    
    return { 
      success: false, 
      message: response.data.message || 'Login failed' 
    };
  } catch (error: any) {
    console.error('Login error:', error);
    return { 
      success: false, 
      message: error.response?.data?.message || 'An error occurred during login'
    };
  }
};

/**
 * Logout function - removes token
 */
export const logout = () => {
  // Remove token from cookies
  removeAuthToken();
  
  // Clear user data from localStorage
  clearUserData();
  
  // Redirect to login page
  window.location.href = '/';
};

/**
 * Set user data in localStorage
 * @param userData The user data to store
 */
export const setUserData = (userData: User): void => {
  if (typeof window === 'undefined') {
    return; // Don't try to use localStorage during SSR
  }
  
  try {
    // Store using both keys for backwards compatibility
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Also update the current user in the app
    setCurrentUser(userData);
  } catch (error) {
    console.error('Error storing user data in localStorage:', error);
  }
};

/**
 * Get user data from localStorage
 * @returns The user data or null if not found
 */
export const getUserData = (): User | null => {
  if (typeof window === 'undefined') {
    return null; // Return null during SSR
  }
  
  try {
    // Try to get from localStorage using the USER_DATA_KEY constant first
    let userStr = localStorage.getItem(USER_DATA_KEY);
    
    // Fallback to 'user' key if not found with USER_DATA_KEY
    if (!userStr) {
      userStr = localStorage.getItem('user');
    }
    
    if (!userStr) {
      return null;
    }
    
    return JSON.parse(userStr);
  } catch (error) {
    console.error('Error retrieving user data from localStorage:', error);
    return null;
  }
};

/**
 * Clear all user data from localStorage
 */
export const clearUserData = (): void => {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.removeItem(USER_DATA_KEY);
    localStorage.removeItem('user');
  } catch (error) {
    console.error('Error clearing user data from localStorage:', error);
  }
};
