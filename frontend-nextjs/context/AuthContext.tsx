"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import axios from "axios";
import { getAuthToken, setAuthToken, removeAuthToken } from "@/utils/cookies"; // Sử dụng trực tiếp cookie
import { setUserData, getUserData, clearUserData } from "@/utils/auth";
import { useRouter } from "next/navigation";
import { api } from "@/utils/axiosConfig";

// Define the User interface
export interface User {
  userId: string;
  name: string;
  email: string;
  avatarUrl?: string;
  createdAt?: string;
}

// Define the auth context interface
interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Chat service URL
const CHAT_SERVICE_URL = process.env.NEXT_PUBLIC_CHAT_SERVICE_URL || 'http://localhost:3001';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Initialize auth state from cookies/localStorage
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Đọc trực tiếp token từ cookie
        const storedToken = getAuthToken();
        console.log("Initial auth check - token:", storedToken ? "exists" : "not found");
        
        if (storedToken) {
          setToken(storedToken);
          
          // Đọc user từ localStorage
          const storedUser = getUserData();
          
          if (storedUser) {
            console.log("User found in storage:", storedUser.name);
            setUser(storedUser);
          } else {
            // Fetch user profile nếu có token nhưng không có dữ liệu user
            console.log("Fetching user profile with token...");
            try {
              // Sử dụng instance API đã cấu hình sẵn
              const response = await api.get(`/api/auth/profile`);
              
              if (response.data.success && response.data.user) {
                console.log("Profile fetched successfully");
                setUser(response.data.user);
                setUserData(response.data.user);
              }
            } catch (error) {
              console.error('Error fetching profile:', error);
              // Xóa token không hợp lệ
              removeAuthToken();
              clearUserData();
            }
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initAuth();
  }, []);

  // Register function
  const register = useCallback(async (name: string, email: string, password: string) => {
    try {
      setIsLoading(true);

      const response = await axios.post(`${CHAT_SERVICE_URL}/api/auth/register`, {
        name,
        email,
        password,
      });

      if (response.data.success) {
        // Store token in cookie
        setAuthToken(response.data.token);
        setToken(response.data.token);

        // Store user in localStorage
        setUserData(response.data.user);
        setUser(response.data.user);

        return true;
      } else {
        console.error("Registration failed:", response.data.message);
        return false;
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Login function with improved token handling
  const login = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true);
      console.log("Attempting login for:", email);

      const response = await axios.post(`${CHAT_SERVICE_URL}/api/auth/login`, 
        { email, password },
      );
      
      console.log("Login response:", response.data.success ? "success" : "failed");

      if (response.data.success) {
        // Store token
        const authToken = response.data.token;
        console.log("Setting token in cookies:", authToken.substring(0, 10) + "...");
        
        // Set in cookie
        setAuthToken(authToken);
        
        // Also save in local state
        setToken(authToken);
        
        // Save JWT in localStorage as backup
        localStorage.setItem('auth-token-backup', authToken);

        // Store user data
        setUserData(response.data.user);
        setUser(response.data.user);
        console.log("User data saved, login complete");

        return { success: true };
      } else {
        console.log("Login failed:", response.data.message);
        return { success: false, message: response.data.message || "Login failed" };
      }
    } catch (error: any) {
      console.error("Login error:", error);
      return { success: false, message: error.response?.data?.message || "An unexpected error occurred" };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout function
  const logout = useCallback(() => {
    // Remove token from cookies
    removeAuthToken();
    
    // Clear user from state and localStorage
    setUser(null);
    setToken(null);
    
    // Remove user from localStorage
    localStorage.removeItem('user');
    
    // Redirect to login page
    window.location.href = '/';
  }, []);

  // Function to refresh user data
  const refreshUser = useCallback(async () => {
    if (!token) return;
    
    try {
      const response = await api.get(`/api/auth/profile`);
      
      if (response.data.success) {
        setUser(response.data.user);
        setUserData(response.data.user);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      
      // If unauthorized, logout
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        logout();
      }
    }
  }, [token, logout]);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!user && !!token,
      isLoading,
      login,
      register,
      logout,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
