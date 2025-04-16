"use client";

import Image from "next/image";
import { useActiveList } from "@/hooks/useActiveList";
import { useMemo } from "react";

interface AvatarProps {
  user: {
    name?: string | null;
    image?: string | null;
    type?: string;
  };
}

const Avatar: React.FC<AvatarProps> = ({ user }) => {
  const { members } = useActiveList();
  const isActive = user?.name ? members.includes(user.name) : false;

  // Tạo avatar ngẫu nhiên dựa vào tên người dùng sử dụng UI-Avatars
  const avatarUrl = useMemo(() => {
    // Nếu là nhóm, sử dụng avatar mặc định cho nhóm
    if (user.type === "group") {
      return "/assets/group-placeholder.jpeg";
    }
    
    // Nếu đã có avatar, sử dụng avatar có sẵn
    if (user.image && user.image !== "/assets/placeholder.jpg") {
      return user.image;
    }
    
    // Nếu không có tên, sử dụng avatar mặc định
    if (!user.name) {
      return "/assets/placeholder.jpg";
    }
    
    // Tạo avatar từ UI-Avatars
    const name = encodeURIComponent(user.name.trim());
    
    // Tạo màu nền nhất quán dựa trên tên
    const colors = [
      "1abc9c", "2ecc71", "3498db", "9b59b6", "34495e", 
      "16a085", "27ae60", "2980b9", "8e44ad", "2c3e50",
      "f1c40f", "e67e22", "e74c3c", "f39c12", "d35400"
    ];
    
    // Tính toán chỉ số màu dựa trên tên
    const colorIndex = user.name.split('').reduce(
      (acc, char) => acc + char.charCodeAt(0), 0
    ) % colors.length;
    
    const backgroundColor = colors[colorIndex];
    const foregroundColor = "FFFFFF"; // Màu chữ trắng
    
    return `https://ui-avatars.com/api/?name=${name}&background=${backgroundColor}&color=${foregroundColor}&bold=true&format=png&rounded=true`;
  }, [user.name, user.image, user.type]);

  return (
    <div className="relative">
      <div className="relative inline-block rounded-full overflow-hidden h-9 w-9 md:h-11 md:w-11">
        <Image
          src={avatarUrl}
          alt={user.name || "Avatar"}
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
