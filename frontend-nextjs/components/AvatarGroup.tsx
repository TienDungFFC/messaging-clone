"use client";

import Image from "next/image";

interface User {
  id?: string;
  name?: string;
  avatarUrl?: string;
}

interface AvatarGroupProps {
  users?: User[];
  name?: string;
  size?: "small" | "medium" | "large";
}

const AvatarGroup: React.FC<AvatarGroupProps> = ({
  users = [],
  name = "",
  size = "medium",
}) => {
  const sizeMap = {
    small: "h-7 w-7",
    medium: "h-9 w-9",
    large: "h-16 w-16",
  };

  const containerClass = sizeMap[size];

  // If we have users, show a fancy group avatar
  if (users.length > 0) {
    // Limit to at most 3 avatars
    const avatars = users.slice(0, 3);

    // Positions for up to 3 avatars in a group
    const positions = [
      "top-0 left-[12px]",
      "bottom-0 left-0",
      "bottom-0 right-0",
    ];

    return (
      <div className={`relative ${containerClass}`}>
        <div className="absolute w-full h-full rounded-full bg-gray-200" />

        {avatars.map((user, index) => (
          <div
            key={user.id || index}
            className={`absolute ${positions[index]} w-[60%] h-[60%] rounded-full overflow-hidden`}
          >
            {user.avatarUrl ? (
              <Image
                fill
                src={user.avatarUrl}
                alt="Avatar"
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full bg-gray-300 flex items-center justify-center">
                <span className="text-gray-600 text-xs">
                  {user.name?.charAt(0)?.toUpperCase() || "?"}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Fallback to a generic group avatar
  return (
    <div
      className={`relative ${containerClass} bg-gray-300 rounded-full flex items-center justify-center overflow-hidden`}
    >
      <span className="text-gray-600">
        {name?.charAt(0)?.toUpperCase() || "G"}
      </span>
    </div>
  );
};

export default AvatarGroup;
