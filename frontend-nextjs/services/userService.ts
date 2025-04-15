import { api } from '../utils/auth';
import type { User } from '../types';

// Types for responses
interface UserResponse {
  success: boolean;
  users?: any[];
  user?: any;
  message?: string;
}

/**
 * Get all users
 * @returns Promise with all users
 */
export const getAllUsers = async (): Promise<{
  success: boolean;
  users?: User[];
  message?: string;
}> => {
  try {
    const response = await api.get('/api/users');
    
    if (response.data.success) {
      // Transform user data to match the frontend User type
      const transformedUsers = response.data.users.map((user: any) => ({
        id: user.userId,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl || null,
        status: user.status || "active",
      }));
      
      return {
        success: true,
        users: transformedUsers
      };
    } else {
      return {
        success: false,
        message: response.data.message || 'Failed to load users'
      };
    }
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Error loading users'
    };
  }
};

/**
 * Get user by ID
 * @param userId User ID to fetch
 * @returns Promise with user data
 */
export const getUserById = async (userId: string): Promise<{
  success: boolean;
  user?: User;
  message?: string;
}> => {
  try {
    const response = await api.get(`/api/users/${userId}`);
    
    if (response.data.success && response.data.user) {
      // Transform to match frontend User type
      const user: User = {
        id: response.data.user.userId,
        name: response.data.user.name,
        email: response.data.user.email,
        avatarUrl: response.data.user.avatarUrl || null,
        status: response.data.user.status || "active",
      };
      
      return {
        success: true,
        user
      };
    } else {
      return {
        success: false,
        message: response.data.message || 'User not found'
      };
    }
  } catch (error: any) {
    console.error(`Error fetching user ${userId}:`, error);
    return {
      success: false,
      message: error.response?.data?.message || 'Error fetching user'
    };
  }
};

/**
 * Search for users by name
 * @param query Search query
 * @returns Promise with matching users
 */
export const searchUsers = async (query: string): Promise<{
  success: boolean;
  users?: User[];
  message?: string;
}> => {
  try {
    const response = await api.get(`/api/users/search?query=${encodeURIComponent(query)}`);
    
    if (response.data.success) {
      // Transform users to match frontend User type
      const transformedUsers = response.data.users.map((user: any) => ({
        id: user.userId,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl || null,
        status: user.status || "active",
      }));
      
      return {
        success: true,
        users: transformedUsers
      };
    } else {
      return {
        success: false,
        message: response.data.message || 'Search failed'
      };
    }
  } catch (error: any) {
    console.error('Error searching users:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Error searching users'
    };
  }
};

// Export as a default object for convenience
const userService = {
  getAllUsers,
  getUserById,
  searchUsers
};

export default userService;
