require('dotenv').config(); 
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
// const { createAdapter } = require('@socket.io/aws-sqs-adapter');

const { createClient } = require('redis');
const { createAdapter } = require('@socket.io/redis-adapter');

// Import DB module
const db = require('./dynamoConfig');

const app = express();
const server = http.createServer(app);

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
  
  // Store user information when they connect
  socket.on('user:connect', (userData) => {
    const { userId, email } = userData;
    console.log(`User ${userId} (${email}) connected with socket ${socket.id}`);
    
    // Associate this socket with the user
    socket.userId = userId;
    socket.userEmail = email;
    
    // Let other users know this user is online
    socket.broadcast.emit('user:online', { userId, email });
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
    
    try {
      // Lưu tin nhắn vào DynamoDB
      const messageId = await db.saveMessage(data);
      data.messageId = messageId;
      
      // Broadcast message to all clients in this conversation
      io.to(conversationId).emit('message:new', data);
      
      // Also emit with the old event name for backward compatibility
      io.to(conversationId).emit('messages:new', data);
      
      console.log(`Message sent to conversation ${conversationId}`);
    } catch (error) {
      console.error('Error saving message:', error);
      socket.emit('error', { message: 'Không thể lưu tin nhắn' });
    }
  });

  // Add this new socket event handler
  socket.on('message:update', async (data) => {
    console.log('Updating message:', data);
    const { conversationId, messageId } = data;
    
    if (!conversationId) {
      console.error('No conversation ID provided for message update');
      return;
    }
    
    try {
      // Cập nhật tin nhắn trong DynamoDB (bạn cần thêm hàm updateMessage vào module db)
      // await db.updateMessage(data);
      
      // Broadcast the updated message to all clients in this conversation
      io.to(conversationId).emit('message:update', data);
      
      console.log(`Message ${messageId} updated in conversation ${conversationId}`);
    } catch (error) {
      console.error('Error updating message:', error);
      socket.emit('error', { message: 'Không thể cập nhật tin nhắn' });
    }
  });
  
  // Thêm sự kiện để lấy tin nhắn của cuộc trò chuyện
  socket.on('messages:get', async (data) => {
    const { conversationId, limit } = data;
    
    if (!conversationId) {
      socket.emit('error', { message: 'ID cuộc trò chuyện không được cung cấp' });
      return;
    }
    
    try {
      const messages = await db.getConversationMessages(conversationId, limit);
      socket.emit('messages:list', { conversationId, messages });
    } catch (error) {
      console.error('Error fetching messages:', error);
      socket.emit('error', { message: 'Không thể lấy tin nhắn' });
    }
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
  
  // Thiết lập bảng DynamoDB nếu chưa có
  try {
    require('./setup-dynamodb');
    console.log('Đã khởi tạo bảng DynamoDB');
  } catch (error) {
    console.error('Lỗi khi thiết lập DynamoDB:', error);
  }

  const PORT = process.env.PORT || 3001;
  io.listen(PORT, () => {
    console.log(`WebSocket server listening on port ${PORT}`);
  });
})();



// API endpoints cho frontend
app.use(express.json());

// User endpoints
app.get('/users/:userId', async (req, res) => {
  try {
    // Implement logic to get user from DynamoDB
    const userId = req.params.userId;
    // Thêm code để lấy user từ DynamoDB
    const user = await db.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Người dùng không tồn tại' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Lỗi khi lấy thông tin người dùng' });
  }
});

app.post('/users', async (req, res) => {
  try {
    // Implement logic to create user in DynamoDB
    const userData = req.body;
    // Thêm code để tạo user trong DynamoDB
    // const userId = await createUser(userData);
    res.status(201).json({ message: 'Đã tạo người dùng', userData });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Lỗi khi tạo người dùng' });
  }
});

// Conversation endpoints
app.get('/conversations', async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) {
      return res.status(400).json({ error: 'userId là bắt buộc' });
    }
    const conversations = await db.getUserConversations(userId);
    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Lỗi khi lấy cuộc trò chuyện' });
  }
});

app.get('/conversations/:conversationId', async (req, res) => {
  try {
    // Implement logic to get conversation from DynamoDB
    const conversationId = req.params.conversationId;
    // Thêm code để lấy cuộc trò chuyện từ DynamoDB
    res.json({ conversationId, message: 'Chức năng đang được phát triển' });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ error: 'Lỗi khi lấy thông tin cuộc trò chuyện' });
  }
});

app.post('/conversations', async (req, res) => {
  try {
    const conversationData = req.body;
    const conversationId = await db.createConversation(conversationData);
    res.status(201).json({ conversationId, ...conversationData });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Lỗi khi tạo cuộc trò chuyện' });
  }
});

// Message endpoints
app.get('/messages', async (req, res) => {
  try {
    const conversationId = req.query.conversationId;
    if (!conversationId) {
      return res.status(400).json({ error: 'conversationId là bắt buộc' });
    }
    const messages = await db.getConversationMessages(conversationId);
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Lỗi khi lấy tin nhắn' });
  }
});

app.post('/messages', async (req, res) => {
  try {
    const messageData = req.body;
    const messageId = await db.saveMessage(messageData);
    res.status(201).json({ messageId, ...messageData });
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ error: 'Lỗi khi lưu tin nhắn' });
  }
});