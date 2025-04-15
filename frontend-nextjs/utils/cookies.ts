import Cookies from 'js-cookie';

export const TOKEN_NAME = 'auth-token';
export const USER_DATA_KEY = 'user-data';
export const TOKEN_BACKUP_KEY = 'auth-token-backup';

/**
 * Get authentication token từ cookies hoặc localStorage (fallback)
 * @returns {string|undefined} 
 */
export const getAuthToken = (): string | undefined => {
  if (typeof window === 'undefined') {
    return undefined;
  }
  
  try {
    const cookieToken = Cookies.get(TOKEN_NAME);
    console.log("cookieToken: ", cookieToken)
    if (cookieToken) {
      return cookieToken;
    }
    
    const localStorageToken = localStorage.getItem(TOKEN_BACKUP_KEY);
    
    if (localStorageToken) {
      console.log('Token not found in cookies, using localStorage backup');
      
      try {
        Cookies.set(TOKEN_NAME, localStorageToken, {
          expires: 7, 
          path: '/',
          sameSite: 'lax'
        });
        console.log('Restored cookie from localStorage backup');
      } catch (e) {
        console.warn('Failed to restore cookie from backup:', e);
      }
      
      return localStorageToken;
    }
    
    try {
      const rawCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith(`${TOKEN_NAME}=`))
        ?.split('=')[1];
      
      if (rawCookie) {
        console.log('Found token using raw cookie parsing');
        return rawCookie;
      }
    } catch (e) {
      console.warn('Error parsing document.cookie:', e);
    }
    
    console.warn('No authentication token found');
    return undefined;
  } catch (error) {
    console.error('Error in getAuthToken:', error);
    
    try {
      return localStorage.getItem(TOKEN_BACKUP_KEY) || undefined;
    } catch {
      return undefined;
    }
  }
};

export const setAuthToken = (token: string, expiryDays = 7): void => {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    Cookies.set(TOKEN_NAME, token, {
      expires: expiryDays,
      path: '/',
      sameSite: 'lax',
      secure: window.location.protocol === 'https:'
    });
    
    localStorage.setItem(TOKEN_BACKUP_KEY, token);
    
    console.log('Token successfully set in both cookie and localStorage');
  } catch (error) {
    console.error('Error setting token in cookie:', error);
    
    try {
      localStorage.setItem(TOKEN_BACKUP_KEY, token);
      console.log('Token saved to localStorage as backup');
    } catch (e) {
      console.error('Failed to save token backup to localStorage:', e);
    }
  }
};

/**
 * Remove authentication token from both cookies and localStorage
 */
export const removeAuthToken = (): void => {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    Cookies.remove(TOKEN_NAME, { path: '/' });
    
    localStorage.removeItem(TOKEN_BACKUP_KEY);
    
    console.log('Token removed from both cookie and localStorage');
  } catch (error) {
    console.error('Error removing token:', error);
  }
};

/**
 * Check if user is authenticated (has valid token cookie)
 * @returns Boolean indicating if token exists
 */
export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

/**
 * Store user data in a cookie
 * @param userData User data object
 * @param expiryDays Number of days until cookie expires
 */
export const setUserData = (userData: any, expiryDays = 7) => {
  try {
    const userDataStr = JSON.stringify(userData);
    Cookies.set(USER_DATA_KEY, userDataStr, {
      expires: expiryDays,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
  } catch (error) {
    console.error('Error storing user data in cookie:', error);
  }
};

/**
 * Get user data from cookie
 * @returns User data object or null if not found
 */
export const getUserData = () => {
  try {
    const userDataStr = Cookies.get(USER_DATA_KEY);
    if (!userDataStr) return null;
    return JSON.parse(userDataStr);
  } catch (error) {
    console.error('Error parsing user data from cookie:', error);
    return null;
  }
};

/**
 * Remove user data cookie
 */
export const removeUserData = () => {
  Cookies.remove(USER_DATA_KEY, { path: '/' });
};

/**
 * Clear all authentication related cookies
 */
export const clearAuthCookies = () => {
  removeAuthToken();
  removeUserData();
};
