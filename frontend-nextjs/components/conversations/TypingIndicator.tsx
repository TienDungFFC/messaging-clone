"use client";

import { motion } from "framer-motion";
import clsx from "clsx";
import Avatar from "../Avatar";

interface TypingIndicatorProps {
  userName: string;
  isOwn?: boolean;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  userName,
  isOwn = false
}) => {
  const container = clsx(`flex gap-3 p-4`, isOwn && "justify-end");
  const avatar = clsx(isOwn && "order-2");
  const body = clsx(`flex flex-col gap-2`, isOwn && "items-end");

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
      <div className={body}>
        <div className="flex items-center gap-1.5 py-1.5 px-3 bg-gray-100 dark:bg-gray-800 rounded-full max-w-fit mt-1 transition-all duration-200 shadow-sm">
          <span className="font-medium text-xs text-gray-700 dark:text-gray-300">
            {userName}
          </span>
          <span className="text-xs text-gray-600 dark:text-gray-400">đang nhập</span>
          <div className="flex items-center space-x-0.5">
            <div className="w-1 h-1 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-1 h-1 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            <div className="w-1 h-1 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '600ms' }}></div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TypingIndicator;