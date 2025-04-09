import { io } from "socket.io-client";

const CHAT_SERVICE_URL = process.env.NEXT_PUBLIC_CHAT_SERVICE_URL || 'http://localhost:3000';

export const socket = io(CHAT_SERVICE_URL, {
  autoConnect: true,
  reconnection: true
});