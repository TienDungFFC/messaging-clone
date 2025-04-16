import 'dotenv/config.js';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import conversationRoutes from './routes/conversationRoutes.js';
import authRoutes from './routes/authRoutes.js'; // Assuming auth routes exist
import userRoutes from './routes/userRoutes.js'; // Assuming user routes exist
import * as Presence from './lib/presence.js';

// Import Message và Conversation models
import * as Message from './models/Message.js';

import cors from 'cors';

const app = express();
const server = http.createServer(app);

// Middleware for parsing JSON
app.use(express.json());

// Cấu hình CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Add basic route for health check
app.get('/', (req, res) => {
  res.send('Chat service is running');
});

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Attach HTTP routes
app.use('/api/auth', authRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/users', userRoutes);

const io = new Server(server, {
  cors: {
    origin: '*', // In production, restrict this to allowed origins
    methods: ['GET', 'POST'],
    credentials: true
  },
});

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

const pubClient = createClient({ url: redisUrl });
const subClient = pubClient.duplicate();

pubClient.on('error', (err) => {
  console.error('Redis pubClient error:', err);
});

subClient.on('error', (err) => {
  console.error('Redis subClient error:', err);
});

await Promise.all([
  pubClient.connect(),
  subClient.connect()
]);

io.adapter(createAdapter(pubClient, subClient));

// Track users and their conversations
const userConversations = new Map();

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // WebSocket event handlers
  socket.on('user:connect', async (userData) => {
    const { userId, email } = userData;
    console.log(`User ${userId} (${email}) connected with socket ${socket.id}`);
    socket.userId = userId;
    socket.userEmail = email;
    
    socket.connectionId = socket.id;
    await Presence.upsert(socket.connectionId, { userId, email });

    io.emit('user:online', { userId, email });
  });

  socket.on('join:conversation', (conversationId) => {
    console.log(`Client ${socket.id} joining conversation ${conversationId}`);
    if (socket.currentConversation) {
      socket.leave(socket.currentConversation);
    }
    socket.join(conversationId);
    socket.currentConversation = conversationId;
    if (!userConversations.has(socket.userId)) {
      userConversations.set(socket.userId, new Set());
    }
    userConversations.get(socket.userId).add(conversationId);
    socket.to(conversationId).emit('user:joined', {
      conversationId,
      userId: socket.userId,
      email: socket.userEmail,
    });
  });

  socket.on('message:send', async (data) => {
    console.log('Received message via socket:', data);
    const { conversationId, message, messageType = 'text', senderId, createdAt, sender } = data;
    
    if (!conversationId || !message || !senderId) {
      console.error('Missing required message data');
      socket.emit('error', { message: 'Missing required message data' });
      return;
    }
    
    try {
      // Chuẩn bị thông tin người gửi từ dữ liệu nhận được
      const senderInfo = {
        senderName: sender?.name || 'Unknown User',
        senderAvatar: sender?.image || ''
      };
      
      // Tạo tin nhắn mới trong cơ sở dữ liệu
      const savedMessage = await Message.create(
        conversationId,
        senderId,
        message,  // Sử dụng 'message' từ dữ liệu nhận được
        messageType || 'text',
        senderInfo
      );
      
      if (!savedMessage) {
        socket.emit('error', { message: 'Failed to save message' });
        return;
      }
      
      // Phát sóng tin nhắn mới đến tất cả người dùng trong cuộc trò chuyện
      io.to(conversationId).emit('message:new', savedMessage);
      
      console.log(`Message broadcast to conversation ${conversationId}`);
    } catch (error) {
      console.error('Error saving message:', error);
      socket.emit('error', { message: 'Error saving message' });
    }
  });

  // Typing indicators
  socket.on('typing', (data) => {
    const { conversationId, userId } = data;
    if (!conversationId || !userId) return;
    
    // Broadcast typing event to conversation except sender
    socket.to(conversationId).emit('user:typing', { userId, conversationId });
  });
  
  socket.on("stop:typing", ({ conversationId, userId }) => {
    socket.to(conversationId).emit("user:stop-typing", { 
      conversationId, 
      userId 
    });
  });

  socket.on('disconnect', async () => {
    console.log(`Client disconnected: ${socket.id}`);
    if (socket.userId && userConversations.has(socket.userId)) {
      userConversations.delete(socket.userId);
    }
    await Presence.remove(socket.id);
    if (socket.userId) {
      io.emit('user:offline', {
        userId: socket.userId,
        email: socket.userEmail,
      });
    }
  });
  socket.on("presence:check", async (targetUserId, callback) => {
    try {
      const onlineUsers = await Presence.list();
      const isOnline = onlineUsers.some(
        (entry) => entry.meta?.userId === targetUserId
      );
      callback(isOnline);
    } catch (err) {
      console.error("Presence check failed", err);
      callback(false);
    }
  });
});

// Start the server
(async () => {
  try {
    const PORT = process.env.PORT || 3001;
    server.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
  }
})();

export { app, server };