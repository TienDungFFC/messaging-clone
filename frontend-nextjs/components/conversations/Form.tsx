"use client";

import { useCallback, useEffect, useRef } from "react";
import { HiPhoto, HiPaperAirplane } from "react-icons/hi2";
import { CldUploadButton } from "next-cloudinary";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import MessageInput from "./MessageInput";
import { useSocket } from "@/context/SocketContext";
import { useSession } from "@/hooks/useSession";

interface FormProps {
  conversationId: string;
  onMessageSent?: () => void;
}

const Form: React.FC<FormProps> = ({ conversationId, onMessageSent }) => {
  const { socket, isConnected, sendMessage } = useSocket();
  const currentUser = useSession().user;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FieldValues>({
    defaultValues: {
      message: "",
    },
  });
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const TYPING_TIMEOUT = 3000;
  const startTyping = () => {
    if (!socket || !isConnected || !currentUser) return;

    socket.emit("typing", {
      conversationId,
      userId: currentUser.id,
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop:typing", {
        conversationId,
        userId: currentUser.id,
      });
    }, TYPING_TIMEOUT);
  };

  const onSubmit: SubmitHandler<FieldValues> = async (data) => {
    if (!conversationId || !data.message.trim()) return;

    try {
      setValue("message", "", { shouldValidate: true });

      if (socket) {
        socket.emit("stop:typing", {
          conversationId,
          userId: currentUser?.id,
        });
      }

      const senderId = currentUser?.id || "";
      const content = data.message;

      if (isConnected) {
        sendMessage(conversationId, content, senderId, "text");

        if (onMessageSent) {
          onMessageSent();
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleUpload = useCallback(
    async (result: any) => {
      try {
        const imageUrl = result?.info?.secure_url;

        if (imageUrl && conversationId) {
          // Lấy thông tin người gửi
          const senderId = currentUser?.id || "";

          // Gửi tin nhắn hình ảnh qua WebSocket
          if (isConnected) {
            // Gửi tin nhắn với cấu trúc đúng và loại tin nhắn là 'image'
            sendMessage(conversationId, imageUrl, senderId, "image");

            // Thông báo cho component cha
            if (onMessageSent) {
              onMessageSent();
            }
          }
        }
      } catch (error) {
        console.error("Error uploading image:", error);
      }
    },
    [conversationId, onMessageSent, isConnected, sendMessage, currentUser]
  );

  return (
    <div className="py-4 px-4 bg-white dark:bg-black border-t dark:border-t-gray-600 flex items-center gap-2 lg:gap-4 w-full">
      <CldUploadButton
        options={{ maxFiles: 1 }}
        onUpload={handleUpload}
        uploadPreset="mwmercnn"
      >
        <HiPhoto size={30} className="text-sky-500" />
      </CldUploadButton>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex items-center gap-2 lg:gap-4 w-full"
      >
        <MessageInput
          id="message"
          register={register}
          errors={errors}
          required
          placeholder="Write a message"
          onChange={startTyping}
        />
        <button
          type="submit"
          className="rounded-full p-2 bg-sky-500 cursor-pointer hover:bg-sky-600 transition"
        >
          <HiPaperAirplane size={18} className="text-white" />
        </button>
      </form>
    </div>
  );
};

export default Form;
