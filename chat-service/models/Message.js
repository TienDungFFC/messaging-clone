import { v4 as uuidv4 } from 'uuid';
import * as DB from '../lib/db.js';

/**
 * Create a new message
 * @param {String} conversationId 
 * @param {String} senderId 
 * @param {String} content 
 * @param {String} messageType - 'text', 'image', 'file', etc.
 * @param {Object} senderInfo - Optional sender information
 * @returns {Promise<Object>} The created message
 */
export async function create(conversationId, senderId, content, messageType = 'text', senderInfo = null) {
  const timestamp = new Date().toISOString();
  const messageId = uuidv4();
  
  // Get sender info if not provided
  if (!senderInfo) {
    // Import User dynamically to avoid circular dependency
    const User = await import('./User.js');
    const sender = await User.getUserById(senderId);
    if (sender) {
      senderInfo = {
        senderName: sender.name,
        senderAvatar: sender.avatarUrl || ''
      };
    } else {
      senderInfo = {
        senderName: 'Unknown User',
        senderAvatar: ''
      };
    }
  }
  
  const message = {
    PK: `CONV#${conversationId}`,
    SK: `MSG#${timestamp}#${messageId}`,
    GSI1PK: `USER#${senderId}`,
    GSI1SK: `MSG#${timestamp}#${messageId}`,
    messageId,
    conversationId,
    senderId,
    content,
    messageType,
    status: 'sent',
    entityType: 'MESSAGE',
    timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
    // Add sender information
    senderName: senderInfo.senderName,
    senderAvatar: senderInfo.senderAvatar
  };
  
  try {
    await DB.put({
      TableName: process.env.DYNAMODB_TABLE || 'ChatTable',
      Item: message
    });
    
    // Update the conversation's last message preview
    const previewLength = 50;
    const preview = content.length > previewLength 
      ? `${content.substring(0, previewLength)}...` 
      : content;
    
    // Import Conversation dynamically to avoid circular dependency
    const Conversation = await import('./Conversation.js');
    await Conversation.updateLastMessage(conversationId, preview, timestamp);
    
    // Mark as read by the sender
    // Import ReadReceipt dynamically to avoid circular dependency
    const ReadReceipt = await import('./ReadReceipt.js');
    await ReadReceipt.markAsRead(conversationId, messageId, senderId, timestamp);
    
    // Update sender's lastReadTimestamp in the conversation
    await Conversation.updateLastReadTimestamp(conversationId, senderId, timestamp);
    
    return message;
  } catch (error) {
    console.error('Error creating message:', error);
    return null;
  }
}

/**
 * Get a specific message by ID
 * @param {String} conversationId 
 * @param {String} messageId 
 * @param {String} timestamp - Optional, for more efficient retrieval
 * @returns {Promise<Object>} The message
 */
export async function getById(conversationId, messageId, timestamp = null) {
  // If we don't know the exact timestamp, we need to query
  if (!timestamp) {
    try {
      const result = await DB.query({
        TableName: process.env.DYNAMODB_TABLE || 'ChatTable',
        KeyConditionExpression: 'PK = :convKey AND begins_with(SK, :msgPrefix)',
        ExpressionAttributeValues: { 
          ':convKey': `CONV#${conversationId}`,
          ':msgPrefix': 'MSG#' 
        }
      });
      
      if (result.Items && result.Items.length > 0) {
        const message = result.Items.find(msg => msg.messageId === messageId);
        return message || null;
      }
      
      return null;
    } catch (error) {
      console.error('Error querying message:', error);
      return null;
    }
  }
  
  // If we know the timestamp, we can do a direct get
  const sortKey = `MSG#${timestamp}#${messageId}`;
  try {
    const message = await DB.get({
      TableName: process.env.DYNAMODB_TABLE || 'ChatTable',
      Key: { 
        PK: `CONV#${conversationId}`, 
        SK: sortKey
      }
    });
    
    // If we don't have sender info in the message, fetch it
    if (message && !message.senderName) {
      // Import User dynamically to avoid circular dependency
      const User = await import('./User.js');
      const sender = await User.getUserById(message.senderId);
      if (sender) {
        message.senderName = sender.name;
        message.senderAvatar = sender.avatarUrl || '';
      } else {
        message.senderName = 'Unknown User';
        message.senderAvatar = '';
      }
    }
    
    return message;
  } catch (error) {
    console.error('Error getting message:', error);
    return null;
  }
}

/**
 * Get all messages for a conversation
 * @param {String} conversationId 
 * @param {Number} limit 
 * @param {String} lastEvaluatedKey - For pagination
 * @returns {Promise<Object>} Object containing messages and lastEvaluatedKey
 */
export async function getByConversation(conversationId, limit = 50, lastEvaluatedKey = null) {
  const queryParams = {
    TableName: process.env.DYNAMODB_TABLE || 'ChatTable',
    KeyConditionExpression: 'PK = :convKey AND begins_with(SK, :msgPrefix)',
    ExpressionAttributeValues: { 
      ':convKey': `CONV#${conversationId}`,
      ':msgPrefix': 'MSG#' 
    },
    Limit: limit,
    ScanIndexForward: false // For descending order (newest first)
  };
  
  if (lastEvaluatedKey) {
    try {
      queryParams.ExclusiveStartKey = JSON.parse(Buffer.from(lastEvaluatedKey, 'base64').toString());
    } catch (error) {
      console.error('Error parsing lastEvaluatedKey:', error);
    }
  }
  
  try {
    const result = await DB.query(queryParams);
    
    let nextPageKey = null;
    if (result.LastEvaluatedKey) {
      nextPageKey = Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64');
    }

    // Get unique sender IDs from messages
    const senderIds = [...new Set(result.Items.map(message => message.senderId))];
    
    // Import User dynamically to avoid circular dependency
    const User = await import('./User.js');
    
    // Get user details for all senders in batch
    const userDetails = await User.getBatchUserDetails(senderIds);
    
    // Add user details to each message
    const messagesWithUserDetails = result.Items.map(message => {
      const sender = userDetails[message.senderId] || {};
      return {
        ...message,
        senderName: sender.name || message.senderName || 'Unknown User',
        senderAvatar: sender.avatarUrl || message.senderAvatar || ''
      };
    });

    return { 
      messages: messagesWithUserDetails,
      nextPageKey
    };
  } catch (error) {
    console.error('Error fetching messages:', error);
    return { messages: [], nextPageKey: null, error };
  }
}

/**
 * Get all messages sent by a specific user
 * @param {String} senderId 
 * @param {Number} limit 
 * @returns {Promise<Array>} Array of messages
 */
export async function getBySender(senderId, limit = 50) {
  try {
    const result = await DB.query({
      TableName: process.env.DYNAMODB_TABLE || 'ChatTable',
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :senderKey AND begins_with(GSI1SK, :msgPrefix)',
      ExpressionAttributeValues: { 
        ':senderKey': `USER#${senderId}`,
        ':msgPrefix': 'MSG#' 
      },
      Limit: limit
    });
    
    return result.Items || [];
  } catch (error) {
    console.error('Error getting messages by sender:', error);
    return [];
  }
}

/**
 * Update message status (read, delivered, etc.)
 * @param {String} conversationId 
 * @param {String} messageId 
 * @param {String} status 
 * @returns {Promise<Object>} Updated message
 */
export async function updateStatus(conversationId, messageId, status) {
  // First, find the message to get its sort key
  const message = await getById(conversationId, messageId);
  if (!message) {
    return null;
  }
  
  try {
    const result = await DB.update({
      TableName: process.env.DYNAMODB_TABLE || 'ChatTable',
      Key: { 
        PK: `CONV#${conversationId}`, 
        SK: message.SK 
      },
      UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
      ExpressionAttributeValues: { 
        ':status': status,
        ':updatedAt': new Date().toISOString()
      },
      ExpressionAttributeNames: { '#status': 'status' }
    });
    
    return result;
  } catch (error) {
    console.error('Error updating message status:', error);
    return null;
  }
}

/**
 * Update message content
 * @param {String} conversationId 
 * @param {String} messageId 
 * @param {String} content 
 * @returns {Promise<Object>} Updated message
 */
export async function updateContent(conversationId, messageId, content) {
  // First, find the message to get its sort key
  const message = await getById(conversationId, messageId);
  if (!message) {
    return null;
  }
  
  try {
    const result = await DB.update({
      TableName: process.env.DYNAMODB_TABLE || 'ChatTable',
      Key: { 
        PK: `CONV#${conversationId}`, 
        SK: message.SK 
      },
      UpdateExpression: 'SET content = :content, updatedAt = :updatedAt',
      ExpressionAttributeValues: { 
        ':content': content,
        ':updatedAt': new Date().toISOString()
      }
    });
    
    return result;
  } catch (error) {
    console.error('Error updating message content:', error);
    return null;
  }
}

/**
 * Delete a message
 * @param {String} conversationId 
 * @param {String} messageId 
 * @returns {Promise<Boolean>} Success status
 */
export async function deleteMessage(conversationId, messageId) {
  // First, find the message to get its sort key
  const message = await getById(conversationId, messageId);
  if (!message) {
    return false;
  }
  
  try {
    // Set up a transaction for deleting the message
    // We need to use transact because we may need to delete multiple items
    const transactItems = [
      {
        Delete: {
          TableName: process.env.DYNAMODB_TABLE || 'ChatTable',
          Key: {
            PK: `CONV#${conversationId}`,
            SK: message.SK
          }
        }
      }
    ];
    
    // Delete all read receipts for this message
    // Import ReadReceipt dynamically to avoid circular dependency
    const ReadReceipt = await import('./ReadReceipt.js');
    const receipts = await ReadReceipt.getByMessage(conversationId, messageId);
    
    if (receipts && Array.isArray(receipts)) {
      for (const receipt of receipts) {
        transactItems.push({
          Delete: {
            TableName: process.env.DYNAMODB_TABLE || 'ChatTable',
            Key: {
              PK: `RECEIPT#${conversationId}#${messageId}`,
              SK: `USER#${receipt.userId}`
            }
          }
        });
      }
    }
    
    await DB.transact({
      TransactItems: transactItems
    });
    
    return true;
  } catch (error) {
    console.error('Error deleting message:', error);
    return false;
  }
}

// Export default với tên các hàm khác với "delete" vì đó là từ khóa
export default {
  create,
  getById,
  getByConversation,
  getBySender,
  updateStatus,
  updateContent,
  delete: deleteMessage
};
