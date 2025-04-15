"use client";

import Image from "next/image";
import { useActiveList } from "@/hooks/useActiveList";

interface AvatarProps {
  user: {
    name?: string | null;
    image?: string | null;
  };
}

const Avatar: React.FC<AvatarProps> = ({ user }) => {
  // You'll need to implement this hook to track active users
  const { members } = useActiveList();
  const isActive = user?.name ? members.includes(user.name) : false;

  return (
    <div className="relative">
      <div className="relative inline-block rounded-full overflow-hidden h-9 w-9 md:h-11 md:w-11">
        <Image
          src={user?.image || "/assets/placeholder.jpg"}
          alt="Avatar"
          height={100}
          width={100}
        />
      </div>
      {isActive && (
        <span className="absolute block rounded-full bg-green-500 ring-2 ring-white top-0 right-0 h-2 w-2 md:h-3 md:w-3" />
      )}
    </div>
  );
};

export default Avatar;
