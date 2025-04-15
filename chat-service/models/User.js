import { v4 as uuidv4 } from 'uuid';
import * as DB from '../lib/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

/**
 * Create a new user
 * @param {String} email 
 * @param {String} name 
 * @param {String} password - Should be hashed before storing
 * @param {String} avatarUrl 
 * @returns {Promise<Object>} The created user
 */
export async function createUser(email, name, password, avatarUrl = '') {
  const timestamp = new Date().toISOString();
  const userId = uuidv4();
  
  const user = {
    PK: `USER#${userId}`,
    SK: `PROFILE#${userId}`,
    GSI1PK: `EMAIL#${email.toLowerCase()}`,
    GSI1SK: `USER#${userId}`,
    GSI2PK: `USER`,
    GSI2SK: `NAME#${name}`,
    userId,
    email: email.toLowerCase(),
    name,
    password, // This should be already hashed
    avatarUrl,
    status: 'active',
    entityType: 'USER',
    createdAt: timestamp,
    updatedAt: timestamp,
    lastSeen: timestamp
  };
  
  try {
    await DB.put({
      TableName: process.env.DYNAMODB_TABLE || 'ChatTable',
      Item: user
    });
    return user;
  } catch (error) {
    console.error('Error creating user:', error);
    return null;
  }
}

/**
 * Get a user by ID
 * @param {String} userId 
 * @returns {Promise<Object>} The user
 */
export async function getUserById(userId) {
  try {
    return await DB.get({
      TableName: process.env.DYNAMODB_TABLE || 'ChatTable',
      Key: { 
        PK: `USER#${userId}`, 
        SK: `PROFILE#${userId}` 
      }
    });
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return null;
  }
}

/**
 * Find a user by email
 * @param {String} email 
 * @returns {Promise<Object>} The user if found
 */
export async function findUserByEmail(email) {
  try {
    const result = await DB.query({
      TableName: process.env.DYNAMODB_TABLE || 'ChatTable',
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :email',
      ExpressionAttributeValues: { 
        ':email': `EMAIL#${email.toLowerCase()}` 
      }
    });
    
    if (!result.Items || result.Items.length === 0) {
      return null;
    }
    
    return result.Items[0];
  } catch (error) {
    console.error('Error finding user by email:', error);
    return null;
  }
}

/**
 * Search users by name
 * @param {String} searchTerm 
 * @returns {Promise<Array>} Array of users matching the search
 */
export async function searchUsersByName(searchTerm) {
  try {
    const result = await DB.query({
      TableName: process.env.DYNAMODB_TABLE || 'ChatTable',
      IndexName: 'GSI2',
      KeyConditionExpression: 'GSI2PK = :userType AND begins_with(GSI2SK, :searchTerm)',
      ExpressionAttributeValues: { 
        ':userType': 'USER',
        ':searchTerm': `NAME#${searchTerm}`
      }
    });
    
    return result.Items || [];
  } catch (error) {
    console.error('Error searching users by name:', error);
    return [];
  }
}

/**
 * Update user profile information
 * @param {String} userId 
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated user
 */
export async function updateUserProfile(userId, updates) {
  const allowedUpdates = ['name', 'avatarUrl', 'status'];
  
  // Build update expression dynamically based on provided updates
  let updateExpression = 'SET updatedAt = :updatedAt';
  const expressionAttributeValues = {
    ':updatedAt': new Date().toISOString()
  };
  
  Object.keys(updates).forEach(key => {
    if (allowedUpdates.includes(key) && updates[key] !== undefined) {
      updateExpression += `, ${key} = :${key}`;
      expressionAttributeValues[`:${key}`] = updates[key];
      
      // Update GSI for name if changed
      if (key === 'name') {
        updateExpression += ', GSI2SK = :newName';
        expressionAttributeValues[':newName'] = `NAME#${updates.name}`;
      }
    }
  });
  
  // If no valid updates were provided, return null
  if (Object.keys(expressionAttributeValues).length === 1) {
    return null;
  }
  
  try {
    return await DB.update({
      TableName: process.env.DYNAMODB_TABLE || 'ChatTable',
      Key: { 
        PK: `USER#${userId}`, 
        SK: `PROFILE#${userId}` 
      },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return null;
  }
}

/**
 * Update user's last seen timestamp
 * @param {String} userId 
 * @returns {Promise<Object>} Updated user
 */
export async function updateUserLastSeen(userId) {
  const timestamp = new Date().toISOString();
  
  try {
    return await DB.update({
      TableName: process.env.DYNAMODB_TABLE || 'ChatTable',
      Key: { 
        PK: `USER#${userId}`, 
        SK: `PROFILE#${userId}` 
      },
      UpdateExpression: 'SET lastSeen = :timestamp, updatedAt = :timestamp',
      ExpressionAttributeValues: { ':timestamp': timestamp }
    });
  } catch (error) {
    console.error('Error updating last seen:', error);
    return null;
  }
}

/**
 * Change user's password
 * @param {String} userId 
 * @param {String} newPassword - Should be hashed before storing
 * @returns {Promise<Object>} Updated user
 */
export async function changeUserPassword(userId, newPassword) {
  try {
    return await DB.update({
      TableName: process.env.DYNAMODB_TABLE || 'ChatTable',
      Key: { 
        PK: `USER#${userId}`, 
        SK: `PROFILE#${userId}` 
      },
      UpdateExpression: 'SET password = :password, updatedAt = :timestamp',
      ExpressionAttributeValues: { 
        ':password': newPassword,
        ':timestamp': new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error changing password:', error);
    return null;
  }
}

/**
 * Login a user with email and password
 * @param {String} email 
 * @param {String} password 
 * @returns {Promise<Object>} Result with user and token if successful
 */
export async function loginUser(email, password) {
  try {
    // Find user by email
    const user = await findUserByEmail(email);
    if (!user) {
      return { 
        success: false, 
        message: 'User not found with this email' 
      };
    }
    
    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return { 
        success: false, 
        message: 'Invalid password' 
      };
    }
    
    // Update last seen timestamp
    await updateUserLastSeen(user.userId);
    
    // Get JWT secret from environment variable
    const jwtSecret = process.env.JWT_SECRET;
    
    if (!jwtSecret) {
      console.error('JWT_SECRET is not defined in environment variables');
      return { 
        success: false, 
        message: 'Server authentication configuration error' 
      };
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.userId, email: user.email },
      jwtSecret,
      { expiresIn: '7d' }
    );
    
    // Return user (without password) and token
    const { password: _, ...userWithoutPassword } = user;
    
    return {
      success: true,
      user: userWithoutPassword,
      token
    };
  } catch (error) {
    console.error('Login error:', error);
    return { 
      success: false, 
      message: 'Error during login process' 
    };
  }
}

/**
 * Get batch user details by array of user IDs
 * @param {Array<String>} userIds 
 * @returns {Promise<Object>} Object with userId as key and user details as value
 */
export async function getBatchUserDetails(userIds) {
  if (!userIds || userIds.length === 0) {
    return {};
  }
  
  // Remove duplicates
  const uniqueIds = [...new Set(userIds)];
  
  // Prepare keys for batch get
  const keys = uniqueIds.map(id => ({
    PK: `USER#${id}`,
    SK: `PROFILE#${id}`
  }));
  
  try {
    const result = await DB.batchGet({
      RequestItems: {
        [process.env.DYNAMODB_TABLE || 'ChatTable']: {
          Keys: keys
        }
      }
    });
    
    if (!result.Responses || !result.Responses[process.env.DYNAMODB_TABLE || 'ChatTable']) {
      return {};
    }
    
    // Create a map of userId -> user details
    const userMap = {};
    result.Responses[process.env.DYNAMODB_TABLE || 'ChatTable'].forEach(user => {
      // Don't include password in the response
      const { password, ...userWithoutPassword } = user;
      userMap[user.userId] = userWithoutPassword;
    });
    
    return userMap;
  } catch (error) {
    console.error('Error getting batch user details:', error);
    return {};
  }
}

/**
 * Get all users in the system
 * @param {Number} limit - Optional limit of users to return
 * @returns {Promise<Array>} Array of users
 */
export async function getAllUsers(limit = 100) {
  try {
    const result = await DB.query({
      TableName: process.env.DYNAMODB_TABLE || 'ChatTable',
      IndexName: 'GSI2',
      KeyConditionExpression: 'GSI2PK = :userType',
      ExpressionAttributeValues: { ':userType': 'USER' },
      Limit: limit
    });
    
    return result.Items || [];
  } catch (error) {
    console.error('Error getting all users:', error);
    return [];
  }
}
