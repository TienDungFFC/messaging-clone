"use client";

import { useSocket } from "@/context/SocketContext";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import { HiPaperAirplane, HiPhoto } from "react-icons/hi2";
import axios from "axios";
import { CldUploadButton } from "next-cloudinary";
import useConversation from "@/hooks/useConversation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

function Form() {
  const { conversationId } = useConversation();
  const { socket, isConnected, sendMessage, joinConversation } = useSocket();
  const [isLoading, setIsLoading] = useState(false);
  const session = useSession();

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

  // Join the conversation on component mount
  useEffect(() => {
    if (conversationId && isConnected && socket) {
      joinConversation(conversationId);
      
      if (session.data?.user) {
        socket.emit('user:connect', {
          userId: session.data.user.id,
          email: session.data.user.email
        });
      }
    }
    
    return () => {
      // Clean up when component unmounts
      if (socket && conversationId) {
        socket.emit('leave', conversationId);
      }
    };
  }, [conversationId, isConnected, socket, joinConversation, session.data]);

  const onSubmit: SubmitHandler<FieldValues> = async (data) => {
    try {
      setIsLoading(true);
      
      // Clear the input field immediately for better UX
      setValue("message", "", { shouldValidate: true });
      
      // Send via REST API
      const response = await axios.post("/api/messages", {
        ...data,
        conversationId,
      });
      console.log("response:", response.data);
      // If API call successful, also emit via socket
      if (response.data && isConnected) {
        sendMessage(
          conversationId, 
          data.message,
          response.data.senderId
        );
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (result: any) => {
    try {
      setIsLoading(true);
      
      // Send image via REST API
      const response = await axios.post("/api/messages", {
        image: result.info.secure_url,
        conversationId,
      });
      
      // If API call successful, also emit via socket
      if (response.data && socket) {
        socket.emit("message:send", {
          conversationId,
          image: result.info.secure_url,
          senderId: response.data.senderId,
          createdAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setIsLoading(false);
    }
  };

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
        <div className="relative w-full">
          <input
            type="text"
            {...register("message", { required: true })}
            placeholder="Write a message"
            className="
              text-black
              dark:text-white
              font-light
              py-2
              px-4
              bg-neutral-100 
              dark:bg-neutral-800
              w-full 
              rounded-full
              focus:outline-none
            "
            disabled={isLoading}
          />
        </div>
        <button 
          type="submit"
          className="
            rounded-full 
            p-2 
            bg-sky-500 
            cursor-pointer 
            hover:bg-sky-600 
            transition
          "
          disabled={isLoading}
        >
          <HiPaperAirplane
            size={18}
            className="text-white"
          />
        </button>
      </form>
    </div>
  );
}

export default Form;
