"use client";

import { User } from "@/types";
import UserBox from "./UserBox";
import { useEffect, useState } from "react";
import LoadingSpinner from "./LoadingSpinner";
import { getAllUsers } from "@/services/userService";
import { getCurrentUser } from "@/utils/auth";

function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const currentUser = getCurrentUser();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const result = await getAllUsers();

        if (result.success && result.users) {
          setUsers(result.users);
        } else {
          setError(result.message || "Failed to load users");
        }
      } catch (err) {
        console.error("Error fetching users:", err);
        setError("Error loading users. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return (
    <aside className="w-full lg:w-80 border-r border-gray-200 dark:border-gray-700 dark:bg-black h-full overflow-y-auto px-5">
      <div className="h-full overflow-y-auto px-5">
        <div className="flex-col">
          <div className="text-2xl font-bold text-neutral-800 dark:text-neutral-200 py-4">
            People
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="text-red-500 text-center py-4">{error}</div>
        ) : users.length === 0 ? (
          <div className="text-neutral-500 text-center py-4">
            No users found
          </div>
        ) : (
          users.map((user) =>
            currentUser?.id !== user.id ? (
              <UserBox key={user.id} data={user} />
            ) : null
          )
        )}
      </div>
    </aside>
  );
}

export default UserList;
