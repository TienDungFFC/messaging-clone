import 'dotenv/config.js';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import conversationRoutes from './routes/conversationRoutes.js';
import authRoutes from './routes/authRoutes.js'; // Assuming auth routes exist
import userRoutes from './routes/userRoutes.js'; // Assuming user routes exist

// Import DB module

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

// Attach HTTP routes
app.use('/api/auth', authRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/users', userRoutes);

const io = new Server(server, {
  cors: {
    origin: '*', // In production, restrict this to allowed origins
    methods: ['GET', 'POST'],
  },
});

const pubClient = createClient().duplicate();
const subClient = createClient().duplicate();

pubClient.on('error', (err) => {
  console.error('Redis pubClient error:', err);
});

subClient.on('error', (err) => {
  console.error('Redis subClient error:', err);
});

pubClient.connect();
subClient.connect();

io.adapter(createAdapter(pubClient, subClient));

// Track users and their conversations
const userConversations = new Map();

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // WebSocket event handlers
  socket.on('user:connect', (userData) => {
    const { userId, email } = userData;
    console.log(`User ${userId} (${email}) connected with socket ${socket.id}`);
    socket.userId = userId;
    socket.userEmail = email;
    socket.broadcast.emit('user:online', { userId, email });
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
    console.log('Received message:', data);
    const { conversationId } = data;
    if (!conversationId) {
      console.error('No conversation ID provided');
      return;
    }
    data.createdAt = data.createdAt || new Date().toISOString();
    try {
      const messageId = await db.saveMessage(data);
      data.messageId = messageId;
      io.to(conversationId).emit('message:new', data);
      console.log(`Message sent to conversation ${conversationId}`);
    } catch (error) {
      console.error('Error saving message:', error);
      socket.emit('error', { message: 'Unable to save message' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    if (socket.userId && userConversations.has(socket.userId)) {
      userConversations.delete(socket.userId);
    }
    if (socket.userId) {
      io.emit('user:offline', {
        userId: socket.userId,
        email: socket.userEmail,
      });
    }
  });
});

// Start the server
(async () => {
  await io.of('/').adapter.init();

  const PORT = process.env.PORT || 3001;
  server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
})();