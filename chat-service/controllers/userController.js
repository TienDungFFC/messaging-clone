import * as User from '../models/User.js';

/**
 * Get all users in the system
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getAllUsers = async (req, res) => {
  try {
    // Get all users from the database
    const users = await User.getAllUsers();
    
    const sanitizedUsers = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      if (userWithoutPassword.userId) {
        const { userId, ...restOfUser } = userWithoutPassword;
        return {
          id: userId,
          ...restOfUser
        };
      }
      return userWithoutPassword;
    });
    
    res.status(200).json({
      success: true,
      users: sanitizedUsers
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving users'
    });
  }
};

/**
 * Search users by name
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    const users = await User.searchByName(query);
    
    // Remove sensitive data
    const sanitizedUsers = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    
    res.status(200).json({
      success: true,
      users: sanitizedUsers
    });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching users'
    });
  }
};

/**
 * Get user by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.getById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Remove sensitive data
    const { password, ...userWithoutPassword } = user;
    
    res.status(200).json({
      success: true,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving user'
    });
  }
};
