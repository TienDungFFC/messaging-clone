"use client";

import { useEffect, useState } from 'react';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';

const ActiveStatus = () => {
  const [isMounted, setIsMounted] = useState(false);
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();

  // Don't initialize connection until component is mounted and user is available
  useEffect(() => {
    if (!user) return;
    
    setIsMounted(true);
    
    return () => {
      setIsMounted(false);
    };
  }, [user]);

  if (!isMounted) {
    return null;
  }

  // Rest of your component
  return null; // Or your actual UI
};

export default ActiveStatus;
