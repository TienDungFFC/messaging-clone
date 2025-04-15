"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import UserList from "@/components/UserList";
import { useRouter } from 'next/navigation';

export default function UsersPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      // Redirect to login if not authenticated
      router.push("/users");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="flex flex-col h-full p-4">
      <div className="mb-6">
        {/* <h1 className="text-2xl font-bold">Welcome, {<us></us>er.name}!</h1> */}
        {/* <p className="text-gray-500">Find people to chat with below</p> */}
      </div>
      
      <div className="flex-grow overflow-y-auto">
        <UserList />
      </div>
    </div>
  );
}
