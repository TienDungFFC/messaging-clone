"use client";

import { format } from "date-fns";
import clsx from "clsx";
import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";
import Avatar from "../Avatar";
import ImageModal from "../ImageModal";
import { getCurrentUser } from "@/utils/auth";
import { Message } from "@/types";

interface MessageBoxProps {
  data: Message;
  isLast?: boolean;
}

const MessageBox: React.FC<MessageBoxProps> = ({ data, isLast }) => {
  const currentUser = getCurrentUser();
  const [imageModalOpen, setImageModalOpen] = useState(false);
  
  const isOwn = currentUser?.id === data.senderId;
  
  // Format seen list if available
  // const seenList = (data.seen || [])
  //   .filter((user) => user.id !== data.senderId)
  //   .map((user) => user.name)
  //   .join(", ");

  const container = clsx(`flex gap-3 p-4`, isOwn && "justify-end");
  const avatar = clsx(isOwn && "order-2");
  const body = clsx(`flex flex-col gap-2`, isOwn && "items-end");
  const message = clsx(
    "text-sm w-fit overflow-hidden",
    isOwn ? "bg-sky-500 text-white" : "bg-gray-100 dark:bg-gray-900",
    data.messageType === "image" ? "rounded-md p-0" : "rounded-2xl py-2 px-3"
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.2 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.2,
        delay: 0.1,
        ease: [0, 0.71, 0.2, 1.01],
      }}
      className={container}
    >
      <div className={avatar}>
        <Avatar 
          user={{
            image: data.senderAvatar || '/assets/placeholder.jpg',
            name: data.senderName
          }} 
        />
      </div>
      <div className={body}>
        <div className="flex items-center gap-1">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {data.senderName}
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-300">
            {format(new Date(data.createdAt || data.timestamp), "p")}
          </div>
        </div>
        <div className={message}>
          {data.messageType === "image" ? (
            <>
              <ImageModal
                src={data.content}
                isOpen={imageModalOpen}
                onClose={() => setImageModalOpen(false)}
              />
              <Image
                alt="Image"
                height={288}
                width={288}
                onClick={() => setImageModalOpen(true)}
                src={data.content}
                className="object-cover cursor-pointer hover:scale-110 transition translate"
              />
            </>
          ) : (
            <div className="max-w-[350px]">{data.content}</div>
          )}
        </div>
        {/* {isLast && isOwn && seenList.length > 0 && (
          <div className="text-xs font-light text-gray-500 dark:text-gray-400">
            {`Seen by ${seenList}`}
          </div>
        )} */}
      </div>
    </motion.div>
  );
}

export default MessageBox;
