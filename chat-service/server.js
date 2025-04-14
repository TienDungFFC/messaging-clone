require('dotenv').config(); 
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { SNS } = require('@aws-sdk/client-sns');
const { SQS } = require('@aws-sdk/client-sqs');
const { createAdapter } = require('@socket.io/aws-sqs-adapter');

const app = express();
const server = http.createServer(app);

const snsClient = new SNS({ region: process.env.AWS_REGION || 'ap-southeast-1' });
const sqsClient = new SQS({ region: process.env.AWS_REGION || 'ap-southeast-1' });

// Add basic route for health check
app.get('/', (req, res) => {
  res.send('Chat service is running');
});

const io = new Server(server, {
  cors: {
    origin: '*', // In production you should limit this
    methods: ["GET", "POST"]
  }
});

io.adapter(
  createAdapter(snsClient, sqsClient)
);

// Track users and their conversations
const userConversations = new Map();
const onlineUsers = new Set();
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Store user information when they connect
  socket.on('user:connect', (userData) => {
    const { userId, email } = userData;
    console.log(`User ${userId} (${email}) connected with socket ${socket.id}`);

    // Associate this socket with the user
    socket.userId = userId;
    socket.userEmail = email;
    
    onlineUsers.add(email);
    // Let other users know this user is online
    socket.broadcast.emit('user:online', { userId, email });
    socket.emit('user:list', Array.from(onlineUsers));
  });

  socket.on('join:room', (roomId) => {
    console.log(`Client ${socket.id} joining room ${roomId}`);
    socket.join(roomId);
  });
  
  socket.on('join:conversation', (conversationId) => {
    console.log(`Client ${socket.id} joining conversation ${conversationId}`);
    
    // Leave previous conversations (optional - depends on your use case)
    if (socket.currentConversation) {
      socket.leave(socket.currentConversation);
    }
    
    // Join the new conversation
    socket.join(conversationId);
    socket.currentConversation = conversationId;
    
    // Store that this user is in this conversation
    if (!userConversations.has(socket.userId)) {
      userConversations.set(socket.userId, new Set());
    }
    userConversations.get(socket.userId).add(conversationId);
    
    // Notify others in conversation that user joined
    socket.to(conversationId).emit('user:joined', {
      conversationId,
      userId: socket.userId,
      email: socket.userEmail
    });
  });

  socket.on('message:send', async (data) => {
    console.log('Received message:', data);
    const { conversationId, message, senderId } = data;
    
    if (!conversationId) {
      console.error('No conversation ID provided');
      return;
    }
    
    // Add timestamp if not provided
    if (!data.createdAt) {
      data.createdAt = new Date().toISOString();
    }
    
    // Broadcast message to all clients in this conversation
    io.to(conversationId).emit('message:new', data);
    
    // Also emit with the old event name for backward compatibility
    io.to(conversationId).emit('messages:new', data);
    
    console.log(`Message sent to conversation ${conversationId}`);
  });

  // Add this new socket event handler
  socket.on('message:update', (data) => {
    console.log('Updating message:', data);
    const { conversationId, messageId } = data;
    
    if (!conversationId) {
      console.error('No conversation ID provided for message update');
      return;
    }
    
    // Broadcast the updated message to all clients in this conversation
    io.to(conversationId).emit('message:update', data);
    
    console.log(`Message ${messageId} updated in conversation ${conversationId}`);
  });

  socket.on('typing', (data) => {
    const conversationId = data.conversationId;
    if (conversationId) {
      socket.to(conversationId).emit('user:typing', {
        ...data,
        userId: socket.userId
      });
    }
  });

  socket.on('stop:typing', (data) => {
    const conversationId = data.conversationId;
    if (conversationId) {
      socket.to(conversationId).emit('user:stop:typing', {
        ...data,
        userId: socket.userId
      });
    }
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    
    // Clean up user conversations
    if (socket.userId && userConversations.has(socket.userId)) {
      userConversations.delete(socket.userId);
    }
    
    // Let others know user is offline
    if (socket.userId) {
      io.emit('user:offline', { 
        userId: socket.userId,
        email: socket.userEmail
      });
    }
  });
});

(async () => {
  await io.of('/').adapter.init();

  const PORT = process.env.PORT || 3001;
  io.listen(PORT, () => {
    console.log(`WebSocket server listening on port ${PORT}`);
  });
})();