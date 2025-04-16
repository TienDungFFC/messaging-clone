import * as User from '../models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

/**
 * Register a new user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const register = async (req, res) => {
  try {
    const { name, email, password, avatarUrl } = req.body;
    
    // Check if user already exists
    // const existingUser = await User.findByEmail(email);
    const existingUser = await User.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email is already registered'
      });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create new user with hashed password
    // const user = await User.create(email, name, hashedPassword, avatarUrl);
    const user = await User.createUser(email, name, hashedPassword, avatarUrl);

    if (!user) {
      return res.status(500).json({
        success: false,
        message: 'Error creating user'
      });
    }
    
    // Login the user after registration to get a token
    const loginResult = await User.login(email, password);
    
    if (!loginResult.success) {
      return res.status(500).json({
        success: false,
        message: 'User created but unable to login'
      });
    }
    
    // Make sure this JWT sign uses the same secret as verification
    const token = jwt.sign(
      { id: user.userId, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    res.status(201).json({
      success: true,
      user: userWithoutPassword,
      token: loginResult.token
    });
  } catch (error) {
    console.error('Error in register:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering user'
    });
  }
};

/**
 * Login a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }
    
    const result = await User.login(email, password);
    
    if (!result.success) {
      return res.status(200).json({
        success: false,
        message: result.message
      });
    }
    
    res.status(200).json({
      success: true,
      user: result.user,
      token: result.token
    });
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in'
    });
  }
};

/**
 * Get current user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getProfile = async (req, res) => {
  try {
    // User is attached to request by auth middleware
    res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting user profile'
    });
  }
};

/**
 * Update user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateProfile = async (req, res) => {
  try {
    const updates = req.body;
    
    // Don't allow updating email through this endpoint
    if (updates.email) {
      delete updates.email;
    }
    
    const updatedUser = await User.updateProfile(req.user.userId, updates);
    
    if (!updatedUser) {
      return res.status(500).json({
        success: false,
        message: 'Error updating profile'
      });
    }
    
    res.status(200).json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user profile'
    });
  }
};
