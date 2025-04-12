const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { 
  DynamoDBDocumentClient, 
  PutCommand, 
  GetCommand, 
  QueryCommand,
  UpdateCommand
} = require('@aws-sdk/lib-dynamodb');

// Cấu hình DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  // Cho phát triển cục bộ với DynamoDB local
  ...(process.env.NODE_ENV !== 'production' && {
    endpoint: 'http://localhost:8000',
    credentials: {
      accessKeyId: 'dummy',
      secretAccessKey: 'dummy',
    },
  })
});

const docClient = DynamoDBDocumentClient.from(client);

// Tên bảng
const CONVERSATIONS_TABLE = 'Conversations';
const MESSAGES_TABLE = 'Messages';
const USERS_TABLE = 'Users';

// Các hàm thao tác với DynamoDB
const saveMessage = async (messageData) => {
  const { conversationId, senderId, message, createdAt } = messageData;
  
  const messageId = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  
  const command = new PutCommand({
    TableName: MESSAGES_TABLE,
    Item: {
      messageId,
      conversationId,
      senderId,
      message,
      createdAt: createdAt || new Date().toISOString(),
    }
  });

  try {
    await docClient.send(command);
    return messageId;
  } catch (error) {
    console.error('Lỗi khi lưu tin nhắn vào DynamoDB:', error);
    throw error;
  }
};

const getConversationMessages = async (conversationId, limit = 50) => {
  const command = new QueryCommand({
    TableName: MESSAGES_TABLE,
    KeyConditionExpression: 'conversationId = :conversationId',
    ExpressionAttributeValues: {
      ':conversationId': conversationId
    },
    ScanIndexForward: false, // thứ tự giảm dần (mới nhất trước)
    Limit: limit
  });

  try {
    const response = await docClient.send(command);
    return response.Items;
  } catch (error) {
    console.error('Lỗi khi lấy tin nhắn từ DynamoDB:', error);
    throw error;
  }
};

const createConversation = async (conversationData) => {
  const { conversationId, name, createdBy, participants } = conversationData;
  
  const command = new PutCommand({
    TableName: CONVERSATIONS_TABLE,
    Item: {
      conversationId,
      name,
      createdBy,
      participants,
      createdAt: new Date().toISOString(),
    }
  });

  try {
    await docClient.send(command);
    return conversationId;
  } catch (error) {
    console.error('Lỗi khi tạo cuộc trò chuyện trong DynamoDB:', error);
    throw error;
  }
};

const getUserConversations = async (userId) => {
  const command = new QueryCommand({
    TableName: CONVERSATIONS_TABLE,
    IndexName: 'ParticipantsIndex',
    KeyConditionExpression: 'participants = :userId',
    ExpressionAttributeValues: {
      ':userId': userId
    }
  });

  try {
    const response = await docClient.send(command);
    return response.Items;
  } catch (error) {
    console.error('Lỗi khi lấy cuộc trò chuyện của người dùng từ DynamoDB:', error);
    throw error;
  }
};

module.exports = {
  client,
  docClient,
  CONVERSATIONS_TABLE,
  MESSAGES_TABLE,
  USERS_TABLE,
  saveMessage,
  getConversationMessages,
  createConversation,
  getUserConversations
};