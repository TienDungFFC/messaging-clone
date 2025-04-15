import { cookies } from 'next/headers';
import axios from 'axios';

const CHAT_SERVICE_URL = process.env.CHAT_SERVICE_URL || 'http://localhost:3001';

export default async function getCurrentUser() {
  try {
    // Get auth token from cookies
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    if (!token) {
      return null;
    }
    
    // Call API to get current user
    const response = await axios.get(`${CHAT_SERVICE_URL}/api/auth/profile`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (!response.data.success) {
      return null;
    }
    
    return response.data.user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}
