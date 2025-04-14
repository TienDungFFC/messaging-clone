"use client";

import { useSocket } from "@/context/SocketContext";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import { HiPaperAirplane, HiPhoto } from "react-icons/hi2";
import axios from "axios";
import { CldUploadButton } from "next-cloudinary";
import useConversation from "@/hooks/useConversation";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";

function Form() {
  const { conversationId } = useConversation();
  const { socket, isConnected, sendMessage, joinConversation } = useSocket();
  const { data: session } = useSession();
  const currentUser = session?.user;
  const [isLoading, setIsLoading] = useState(false);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);

  const { register, handleSubmit, setValue, watch } = useForm<FieldValues>({
    defaultValues: {
      message: "",
    },
  });

  const message = watch("message");

  // Join room và connect user khi mount
  useEffect(() => {
    if (!socket || !conversationId || !currentUser || !isConnected) return;

    joinConversation(conversationId);

    socket.emit("user:connect", {
      userId: currentUser.id,
      email: currentUser.email,
    });

    return () => {
      socket.emit("leave", conversationId);
    };
  }, [socket, conversationId, currentUser, isConnected]);

  const handleTyping = () => {
    if (!socket || !currentUser) return;

    socket.emit("typing", {
      conversationId,
      userId: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
      image: currentUser.image ?? null,
    });

    if (typingTimeout.current) clearTimeout(typingTimeout.current);

    typingTimeout.current = setTimeout(() => {
      socket.emit("stop:typing", {
        conversationId,
        userId: currentUser.id,
      });
    }, 3000);
  };

  const onSubmit: SubmitHandler<FieldValues> = async (data) => {
    if (!conversationId) return;

    try {
      setIsLoading(true);
      setValue("message", "", { shouldValidate: true });

      const response = await axios.post("/api/messages", {
        ...data,
        conversationId,
      });

      socket?.emit("stop:typing", {
        conversationId,
        userId: currentUser?.id,
      });

      if (response.data && isConnected) {
        sendMessage(conversationId, data.message, response.data.senderId);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (result: any) => {
    if (!conversationId) return;

    try {
      setIsLoading(true);
      await axios.post("/api/messages", {
        image: result.info.secure_url,
        conversationId,
      });
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="py-4 px-4 bg-white dark:bg-black border-t dark:border-t-gray-600 flex items-center gap-2 lg:gap-4 w-full z-30">
      <CldUploadButton
        options={{ maxFiles: 1 }}
        onUpload={handleUpload}
        uploadPreset="mwmercnn"
      >
        <HiPhoto size={30} className="text-sky-500" />
      </CldUploadButton>

      <form onSubmit={handleSubmit(onSubmit)} className="flex w-full gap-2">
        <input
          type="text"
          {...register("message")}
          value={message}
          onChange={(e) => {
            setValue("message", e.target.value);
            handleTyping();
          }}
          placeholder="Write a message"
          className="text-black dark:text-white font-light py-2 px-4 bg-neutral-100 dark:bg-neutral-800 w-full rounded-full focus:outline-none z-50"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="rounded-full p-2 bg-sky-500 hover:bg-sky-600 transition"
          disabled={isLoading}
        >
          <HiPaperAirplane size={18} className="text-white" />
        </button>
      </form>
    </div>
  );
}

export default Form;
