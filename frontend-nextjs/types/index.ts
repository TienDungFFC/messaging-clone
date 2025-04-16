export interface User {
  userId: string;
  name: string;
  email: string;
  avatarUrl?: string;
  status?: string;
  lastSeen?: string;
  createdAt?: string;
}

export interface Conversation {
  conversationId: string;
  name: string;
  type: 'direct' | 'group';
  participantIds: string[];
  lastMessageAt?: string;
  lastMessagePreview?: string;
  otherUser?: {
    userId: string;
    name: string;
    avatarUrl?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface Message {
  messageId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: string;
  status: string;
  conversationId: string;
  messageType: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ReadReceipt {
  conversationId: string;
  messageId: string;
  userId: string;
  readAt: string;
}
