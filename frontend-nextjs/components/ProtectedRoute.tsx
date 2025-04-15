"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import LoadingSpinner from "./LoadingSpinner";

export default function ProtectedRoute({
  children
}: {
  children: React.ReactNode
}) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/');
      }
      
      setIsCheckingAuth(false);
    }
  }, [isLoading, isAuthenticated, router]);
  
  if (isLoading || isCheckingAuth) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }
  
  if (isAuthenticated) {
    return <>{children}</>;
  }
  
  return null;
}
