"use client";

import { useState, useCallback } from "react";
import { api } from "@/utils/auth";

interface FormProps {
  conversationId: string;
  onMessageSent?: () => void;
}

const Form: React.FC<FormProps> = ({ conversationId, onMessageSent }) => {
  const [messageText, setMessageText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async () => {
    if (!messageText.trim()) return;
    
    setIsLoading(true);
    
    try {
      // Send message directly to chat service
      await api.post(`/api/conversations/${conversationId}/messages`, {
        content: messageText,
        messageType: 'text'
      });
      
      setMessageText("");
      
      // Notify parent component that a message was sent
      if (onMessageSent) {
        onMessageSent();
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  }, [messageText, conversationId, onMessageSent]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="p-4 bg-white border-t flex items-center gap-2 lg:gap-4 w-full">
      <textarea
        value={messageText}
        onChange={(e) => setMessageText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isLoading}
        placeholder="Type a message..."
        className="
          flex-grow
          border-0 
          bg-gray-100 
          resize-none 
          rounded-md
          p-3
          focus:ring-1
          focus:ring-blue-500
          focus:outline-none
          min-h-[40px]
          max-h-[120px]
        "
      />
      <button
        onClick={sendMessage}
        disabled={isLoading || !messageText.trim()}
        type="button"
        className="
          rounded-full 
          p-2 
          bg-blue-500 
          cursor-pointer 
          hover:bg-blue-600 
          transition
          disabled:opacity-50
          disabled:cursor-not-allowed
        "
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="currentColor" 
          className="w-5 h-5 text-white"
        >
          <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
        </svg>
      </button>
    </div>
  );
};

export default Form;
