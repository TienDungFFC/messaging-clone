import ClientOnly from "@/components/ClientOnly";
import UserList from "@/components/UserList";
import Sidebar from "@/components/sidebar/Sidebar";
import ProtectedRoute from "@/components/ProtectedRoute";
import React from "react";

export default async function UsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <ProtectedRoute>
      <Sidebar>
        <div className="h-full">
          <ClientOnly>
            <UserList />
          </ClientOnly>
          {children}
        </div>
      </Sidebar>
    </ProtectedRoute>
  );
}
