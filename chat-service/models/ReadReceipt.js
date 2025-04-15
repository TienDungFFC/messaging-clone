import { v4 as uuidv4 } from 'uuid';
import * as DB from '../lib/db.js';

/**
 * Mark a message as read by a user
 * @param {String} conversationId 
 * @param {String} messageId 
 * @param {String} userId 
 * @param {String} timestamp 
 * @returns {Promise<Object>} The read receipt
 */
export const markAsRead = async (conversationId, messageId, userId, timestamp = null) => {
  if (!timestamp) {
    timestamp = new Date().toISOString();
  }
  
  const receipt = {
    PK: `RECEIPT#${conversationId}#${messageId}`,
    SK: `USER#${userId}`,
    GSI3PK: `USER#${userId}`,
    GSI3SK: `RECEIPT#${conversationId}#${messageId}`,
    conversationId,
    messageId,
    userId,
    readAt: timestamp,
    entityType: 'READ_RECEIPT'
  };
  
  try {
    await DB.put({
      TableName: process.env.DYNAMODB_TABLE,
      Item: receipt
    });
    return receipt;
  } catch (error) {
    console.error('Error marking message as read:', error);
    return null;
  }
};

/**
 * Check if a message has been read by a specific user
 * @param {String} conversationId 
 * @param {String} messageId 
 * @param {String} userId 
 * @returns {Promise<Object>} The read receipt if found
 */
export const hasUserRead = async (conversationId, messageId, userId) => {
  try {
    const receipt = await DB.get({
      TableName: process.env.DYNAMODB_TABLE,
      Key: {
        PK: `RECEIPT#${conversationId}#${messageId}`,
        SK: `USER#${userId}`
      }
    });
    
    return receipt;
  } catch (error) {
    console.error('Error checking if message has been read:', error);
    return null;
  }
};

/**
 * Get all users who have read a message
 * @param {String} conversationId 
 * @param {String} messageId 
 * @returns {Promise<Array>} Array of read receipts
 */
export const getByMessage = async (conversationId, messageId) => {
  try {
    const result = await DB.query({
      TableName: process.env.DYNAMODB_TABLE,
      KeyConditionExpression: 'PK = :receiptKey',
      ExpressionAttributeValues: {
        ':receiptKey': `RECEIPT#${conversationId}#${messageId}`
      }
    });
    
    return result.Items || [];
  } catch (error) {
    console.error('Error getting message read receipts:', error);
    return [];
  }
};

/**
 * Get all messages read by a user in a conversation
 * @param {String} conversationId 
 * @param {String} userId 
 * @returns {Promise<Array>} Array of read receipts
 */
export const getByUserInConversation = async (conversationId, userId) => {
  try {
    const result = await DB.query({
      TableName: process.env.DYNAMODB_TABLE,
      IndexName: 'GSI3',
      KeyConditionExpression: 'GSI3PK = :userKey AND begins_with(GSI3SK, :receiptPrefix)',
      ExpressionAttributeValues: {
        ':userKey': `USER#${userId}`,
        ':receiptPrefix': `RECEIPT#${conversationId}#`
      }
    });
    
    return result.Items || [];
  } catch (error) {
    console.error('Error getting user read receipts:', error);
    return [];
  }
};

/**
 * Get unread message count for a user in a conversation
 * @param {String} conversationId 
 * @param {String} userId 
 * @returns {Promise<Number>} Count of unread messages
 */
export const getUnreadCount = async (conversationId, userId) => {
  try {
    // First, get the user's last read timestamp in this conversation
    const userConvData = await DB.get({
      TableName: process.env.DYNAMODB_TABLE,
      Key: {
        PK: `USER#${userId}`,
        SK: `CONV#${conversationId}`
      }
    });
    
    if (!userConvData) {
      return 0; // User is not in the conversation
    }
    
    const lastReadTimestamp = userConvData.lastReadTimestamp;
    
    // Count messages after the last read timestamp
    const messagesResult = await DB.query({
      TableName: process.env.DYNAMODB_TABLE,
      KeyConditionExpression: 'PK = :convKey AND SK > :timeKey',
      ExpressionAttributeValues: {
        ':convKey': `CONV#${conversationId}`,
        ':timeKey': `MSG#${lastReadTimestamp}`
      }
    });
    
    return (messagesResult.Items || []).length;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};

// For backward compatibility
export default {
  markAsRead,
  hasUserRead,
  getByMessage,
  getByUserInConversation,
  getUnreadCount
};
