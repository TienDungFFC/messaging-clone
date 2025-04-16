import jwt from 'jsonwebtoken';
import * as User from '../models/User.js';

/**
 * Authentication middleware for protecting routes
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(200).json({
        success: false,
        message: 'Authentication required. Please provide a valid token.'
      });
    }

    const token = authHeader.split(' ')[1];
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.error('JWT_SECRET is not defined in environment variables');
      return res.status(500).json({
        success: false,
        message: 'Server authentication configuration error.'
      });
    }

    const decoded = jwt.verify(token, jwtSecret);
    const user = await User.getById(decoded.id);

    console.log("user", user)
    if (!user) {
      return res.status(200).json({
        success: false,
        message: 'User not found or token is invalid.'
      });
    }
  
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);

    if (error.name === 'JsonWebTokenError') {
      return res.status(200).json({
        success: false,
        message: 'Invalid token. Please login again.'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(200).json({
        success: false,
        message: 'Token expired. Please login again.'
      });
    }

    return res.status(200).json({
      success: false,
      message: 'Authentication failed. Token is invalid or expired.'
    });
  }
};
