"use client";

import { useEffect, useState } from "react";
import { User } from "@/types";
import { getUserData } from "@/utils/auth";

export const useSession = () => {
  const [session, setSession] = useState<{ user: User | null }>({ user: null });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Thử lấy user từ localStorage (lưu bởi utils/auth.ts)
    const user = getUserData();
    
    if (user) {
      setSession({ user });
    }
    
    setIsLoading(false);
  }, []);

  return {
    ...session,
    isLoading
  };
};

export default useSession;
