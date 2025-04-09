"use client";

import useConversation from "@/hooks/useConversation";
import { socket } from "@/libs/socket";
import { FullMessageType } from "@/type";
import axios from "axios";
import { find } from "lodash";
import { useEffect, useRef, useState } from "react";
import MessageBox from "./MessageBox";
import { useSession } from "next-auth/react"; 

type Props = {
  initialMessages: FullMessageType[];
};

function Body({ initialMessages }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState(initialMessages);
  console.log("message:", messages);
  const { conversationId } = useConversation();
  const { data: session } = useSession();
  const currentUser = session?.user; 

  useEffect(() => {
    axios.post(`/api/conversations/${conversationId}/seen`);
  }, [conversationId]);

  useEffect(() => {
    socket.emit('join:conversation', conversationId);
    
    const messageHandler = (message: FullMessageType) => {
      console.log("message handler: ", message);
      
      // Đảm bảo message có đầy đủ thông tin sender
      if (!message.sender && currentUser && message.senderId === currentUser.id) {
        message.sender = {
          id: currentUser.id,
          name: currentUser.name || "You",
          email: currentUser.email,
          image: currentUser.image || null
        };
      }
      
      if (message.conversationId === conversationId) {
        setMessages((current) => {
          if (find(current, { id: message.id })) {
            return current;
          }
          return [...current, message];
        });
        
        setTimeout(() => {
          bottomRef?.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
      
      if (bottomRef?.current && message.senderId !== currentUser?.id) {
        axios.post(`/api/conversations/${conversationId}/seen`);
      }
    };

    const updateMessageHandler = (newMessage: FullMessageType) => {
      setMessages((current) => current.map((currentMessage) => {
        if (currentMessage.id === newMessage.id) {
          return newMessage;
        }
        return currentMessage;
      }));
    };

    socket.on("messages:new", messageHandler);
    socket.on("message:update", updateMessageHandler);

    return () => {
      socket.emit('leave:conversation', conversationId);
      socket.off("messages:new", messageHandler);
      socket.off("message:update", updateMessageHandler);
    };
  }, [conversationId, currentUser]);

  useEffect(() => {
    bottomRef?.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto dark:bg-black">
      {messages.map((message, index) => (
        <MessageBox
          isLast={index === messages.length - 1}
          key={message.id + index}
          data={message}
        />
      ))}
      <div className="pt-24" ref={bottomRef} />
    </div>
  );
}

export default Body;
