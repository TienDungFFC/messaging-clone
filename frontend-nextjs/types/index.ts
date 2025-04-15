export interface User {
  userId: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface Conversation {
  conversationId: string;
  name: string; // Changed from optional to required
  lastMessagePreview?: string;
  lastMessageAt?: string;
  type: 'direct' | 'group';
  participantIds: string[];
  createdAt: string;
  updatedAt: string;
  otherUser?: User; // Add this for direct conversations
}

export interface Message {
  messageId: string;
  conversationId: string;
  senderId: string;
  content: string;
  messageType: 'text' | 'image' | 'file';
  status: 'sent' | 'delivered' | 'read';
  timestamp: string;
  createdAt: string;
  updatedAt: string;
  senderName: string;
  senderAvatar?: string;
}

export interface ReadReceipt {
  conversationId: string;
  messageId: string;
  userId: string;
  readAt: string;
}
