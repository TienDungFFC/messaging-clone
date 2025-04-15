import { v4 as uuidv4 } from 'uuid';
import * as DB from '../lib/db.js';

/**
 * Create a new conversation
 * @param {Array<String>} participantIds - Array of user IDs
 * @param {String} name - Optional conversation name for group chats
 * @param {String} type - 'direct' or 'group'
 * @returns {Promise<Object>} The created conversation
 */
export async function createConversation(participantIds, name = '', type = 'direct') {
  const timestamp = new Date().toISOString();
  const conversationId = uuidv4();
  
  // Sort and join participant IDs for consistency
  const sortedParticipants = [...participantIds].sort();
  
  const conversation = {
    PK: `CONV#${conversationId}`,
    SK: `#METADATA#${conversationId}`,
    GSI4PK: `CONVERSATION`,
    GSI4SK: timestamp, // For sorting conversations by last activity
    conversationId,
    participantIds: sortedParticipants,
    name: name || (type === 'direct' ? '' : 'New Group'),
    type,
    entityType: 'CONVERSATION',
    createdAt: timestamp,
    updatedAt: timestamp,
    lastMessageAt: timestamp,
    lastMessagePreview: ''
  };
  
  const promises = [
    // Save conversation metadata
    DB.put({
      TableName: process.env.DYNAMODB_TABLE,
      Item: conversation
    })
  ];
  
  // Create relationship between each user and the conversation
  for (const userId of participantIds) {
    promises.push(
      DB.put({
        TableName: process.env.DYNAMODB_TABLE,
        Item: {
          PK: `USER#${userId}`,
          SK: `CONV#${conversationId}`,
          GSI1PK: `CONV#${conversationId}`,
          GSI1SK: `USER#${userId}`,
          GSI4PK: `USER#${userId}`,
          GSI4SK: `CONV#${timestamp}#${conversationId}`, // For sorting user's conversations by last activity
          userId,
          conversationId,
          entityType: 'USER_CONVERSATION',
          joinedAt: timestamp,
          lastReadTimestamp: timestamp
        }
      })
    );
  }
  
  // For direct chats, create a lookup by participants 
  if (type === 'direct' && participantIds.length === 2) {
    promises.push(
      DB.put({
        TableName: process.env.DYNAMODB_TABLE,
        Item: {
          PK: `DIRECT#${sortedParticipants.join('#')}`,
          SK: `CONV#${conversationId}`,
          conversationId,
          participantIds: sortedParticipants,
          entityType: 'DIRECT_LOOKUP'
        }
      })
    );
  }
  
  try {
    await Promise.all(promises);
    return conversation;
  } catch (error) {
    console.error('Error creating conversation:', error);
    return null;
  }
}

/**
 * Get a conversation by ID
 * @param {String} conversationId 
 * @returns {Promise<Object>} The conversation
 */
export async function getConversationById(conversationId) {
  try {
    const result = await DB.get({
      TableName: process.env.DYNAMODB_TABLE,
      Key: { 
        PK: `CONV#${conversationId}`, 
        SK: `#METADATA#${conversationId}` 
      }
    });
    
    return result; // Already returns the Item directly from the get function
  } catch (error) {
    console.error('Error getting conversation by ID:', error);
    return null;
  }
}

/**
 * Find a direct conversation by participants (exact match)
 * @param {Array<String>} participantIds 
 * @returns {Promise<Object>} The conversation if found
 */
export async function findConversationByParticipants(participantIds) {
  if (participantIds.length !== 2) {
    return null; // Direct conversations only have 2 participants
  }
  
  const sortedParticipants = [...participantIds].sort();
  const directKey = `DIRECT#${sortedParticipants.join('#')}`;
  
  try {
    const result = await DB.query({
      TableName: process.env.DYNAMODB_TABLE,
      KeyConditionExpression: 'PK = :directKey AND begins_with(SK, :convPrefix)',
      ExpressionAttributeValues: {
        ':directKey': directKey,
        ':convPrefix': 'CONV#'
      }
    });
    
    if (!result.Items || result.Items.length === 0) {
      return null;
    }
    
    // Get the actual conversation data
    return await getConversationById(result.Items[0].conversationId);
  } catch (error) {
    console.error('Error finding conversation by participants:', error);
    return null;
  }
}

/**
 * Get all conversations for a user
 * @param {String} userId 
 * @returns {Promise<Array>} Array of conversations
 */
export async function getConversationsByUser(userId) {
  try {
    // Get all user-conversation mappings sorted by last activity
    const relationResult = await DB.query({
      TableName: process.env.DYNAMODB_TABLE,
      IndexName: 'GSI4',
      KeyConditionExpression: 'GSI4PK = :userKey',
      ExpressionAttributeValues: {
        ':userKey': `USER#${userId}`
      }
    });
    
    if (!relationResult.Items || relationResult.Items.length === 0) {
      return [];
    }
    
    // Sort by the GSI4SK which contains timestamp
    const sortedRelations = relationResult.Items.sort((a, b) => 
      b.GSI4SK.localeCompare(a.GSI4SK)
    );
    
    // Get the conversation details for each ID
    const conversationPromises = sortedRelations.map(relation => {
      const conversationId = relation.conversationId;
      return getConversationById(conversationId);
    });
    
    const conversations = [];
    const results = await Promise.all(conversationPromises);
    
    for (const result of results) {
      if (result) {
        conversations.push(result);
      }
    }
    
    return conversations;
  } catch (error) {
    console.error('Error getting conversations by user:', error);
    return [];
  }
}

/**
 * Update the last message preview for a conversation
 * @param {String} conversationId 
 * @param {String} lastMessagePreview 
 * @param {String} timestamp
 * @returns {Promise<Object>} Updated conversation
 */
export async function updateLastMessage(conversationId, lastMessagePreview, timestamp = null) {
  if (!timestamp) {
    timestamp = new Date().toISOString();
  }
  
  try {
    // Update conversation metadata
    const result = await DB.update({
      TableName: process.env.DYNAMODB_TABLE,
      Key: { 
        PK: `CONV#${conversationId}`, 
        SK: `#METADATA#${conversationId}` 
      },
      UpdateExpression: 'SET lastMessagePreview = :preview, lastMessageAt = :timestamp, updatedAt = :timestamp, GSI4SK = :timestamp',
      ExpressionAttributeValues: { 
        ':preview': lastMessagePreview,
        ':timestamp': timestamp
      },
      ReturnValues: 'ALL_NEW'
    });
    
    // Update GSI4SK in all user-conversation relationships for sorting
    const participantsResult = await DB.query({
      TableName: process.env.DYNAMODB_TABLE,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :convKey',
      ExpressionAttributeValues: {
        ':convKey': `CONV#${conversationId}`
      }
    });
    
    if (participantsResult.Items && participantsResult.Items.length > 0) {
      const updatePromises = participantsResult.Items.map(participant => 
        DB.update({
          TableName: process.env.DYNAMODB_TABLE,
          Key: { 
            PK: `USER#${participant.userId}`, 
            SK: `CONV#${conversationId}` 
          },
          UpdateExpression: 'SET GSI4SK = :newSortKey',
          ExpressionAttributeValues: { 
            ':newSortKey': `CONV#${timestamp}#${conversationId}`
          }
        })
      );
      
      await Promise.all(updatePromises);
    }
    
    return result;
  } catch (error) {
    console.error('Error updating last message:', error);
    return null;
  }
}

/**
 * Update conversation name (for group chats)
 * @param {String} conversationId 
 * @param {String} name 
 * @returns {Promise<Object>} Updated conversation
 */
export async function updateConversationName(conversationId, name) {
  try {
    const result = await DB.update({
      TableName: process.env.DYNAMODB_TABLE,
      Key: { 
        PK: `CONV#${conversationId}`, 
        SK: `#METADATA#${conversationId}` 
      },
      UpdateExpression: 'SET #name = :name, updatedAt = :timestamp',
      ExpressionAttributeValues: { 
        ':name': name,
        ':timestamp': new Date().toISOString()
      },
      ExpressionAttributeNames: { '#name': 'name' },
      ReturnValues: 'ALL_NEW'
    });
    
    return result;
  } catch (error) {
    console.error('Error updating conversation name:', error);
    return null;
  }
}

/**
 * Add a participant to a group conversation
 * @param {String} conversationId 
 * @param {String} userId 
 * @returns {Promise<Object>} Updated conversation
 */
export async function addParticipantToConversation(conversationId, userId) {
  // First get the current conversation
  const conversation = await getConversationById(conversationId);
  if (!conversation || conversation.type !== 'group') {
    return null;
  }
  
  // If user is already a participant, return the conversation
  if (conversation.participantIds.includes(userId)) {
    return conversation;
  }
  
  const timestamp = new Date().toISOString();
  
  try {
    // Add the user-conversation relationship
    await DB.put({
      TableName: process.env.DYNAMODB_TABLE,
      Item: {
        PK: `USER#${userId}`,
        SK: `CONV#${conversationId}`,
        GSI1PK: `CONV#${conversationId}`,
        GSI1SK: `USER#${userId}`,
        GSI4PK: `USER#${userId}`,
        GSI4SK: `CONV#${timestamp}#${conversationId}`,
        userId,
        conversationId,
        entityType: 'USER_CONVERSATION',
        joinedAt: timestamp,
        lastReadTimestamp: timestamp
      }
    });
    
    // Update the conversation's participant list
    const newParticipantIds = [...conversation.participantIds, userId].sort();
    
    const result = await DB.update({
      TableName: process.env.DYNAMODB_TABLE,
      Key: { 
        PK: `CONV#${conversationId}`, 
        SK: `#METADATA#${conversationId}` 
      },
      UpdateExpression: 'SET participantIds = :participantIds, updatedAt = :timestamp',
      ExpressionAttributeValues: { 
        ':participantIds': newParticipantIds,
        ':timestamp': timestamp
      },
      ReturnValues: 'ALL_NEW'
    });
    
    return result;
  } catch (error) {
    console.error('Error adding participant to conversation:', error);
    return null;
  }
}

/**
 * Remove a participant from a group conversation
 * @param {String} conversationId 
 * @param {String} userId 
 * @returns {Promise<Object>} Updated conversation
 */
export async function removeParticipantFromConversation(conversationId, userId) {
  // First get the current conversation
  const conversation = await getConversationById(conversationId);
  if (!conversation || conversation.type !== 'group') {
    return null;
  }
  
  // If user is not a participant, return the conversation
  if (!conversation.participantIds.includes(userId)) {
    return conversation;
  }
  
  const timestamp = new Date().toISOString();
  
  try {
    // Remove the user-conversation relationship
    await DB.deleteItem({
      TableName: process.env.DYNAMODB_TABLE,
      Key: {
        PK: `USER#${userId}`,
        SK: `CONV#${conversationId}`
      }
    });
    
    // Update the conversation's participant list
    const newParticipantIds = conversation.participantIds.filter(id => id !== userId);
    
    const result = await DB.update({
      TableName: process.env.DYNAMODB_TABLE,
      Key: { 
        PK: `CONV#${conversationId}`, 
        SK: `#METADATA#${conversationId}` 
      },
      UpdateExpression: 'SET participantIds = :participantIds, updatedAt = :timestamp',
      ExpressionAttributeValues: { 
        ':participantIds': newParticipantIds,
        ':timestamp': timestamp
      },
      ReturnValues: 'ALL_NEW'
    });
    
    return result;
  } catch (error) {
    console.error('Error removing participant from conversation:', error);
    return null;
  }
}

/**
 * Update user's last read timestamp in a conversation
 * @param {String} conversationId 
 * @param {String} userId 
 * @param {String} timestamp 
 * @returns {Promise<Object>} Updated user-conversation relationship
 */
export async function updateLastReadTimestamp(conversationId, userId, timestamp = null) {
  if (!timestamp) {
    timestamp = new Date().toISOString();
  }
  
  try {
    const result = await DB.update({
      TableName: process.env.DYNAMODB_TABLE,
      Key: { 
        PK: `USER#${userId}`, 
        SK: `CONV#${conversationId}` 
      },
      UpdateExpression: 'SET lastReadTimestamp = :timestamp',
      ExpressionAttributeValues: { ':timestamp': timestamp },
      ReturnValues: 'ALL_NEW'
    });
    
    return result;
  } catch (error) {
    console.error('Error updating last read timestamp:', error);
    return null;
  }
}

// Tạo một default export để hỗ trợ CommonJS imports
export default {
  createConversation,
  getConversationById,
  findConversationByParticipants,
  getConversationsByUser,
  updateLastMessage,
  updateConversationName,
  addParticipantToConversation,
  removeParticipantFromConversation,
  updateLastReadTimestamp
};


