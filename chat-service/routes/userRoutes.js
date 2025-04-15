import express from 'express';
import { getAllUsers, searchUsers, getUserById } from '../controllers/userController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protected routes - require authentication
router.use(authenticate);

// Get all users
router.get('/', getAllUsers);

// Search users by name
router.get('/search', searchUsers);

// Get user by ID
router.get('/:userId', getUserById);

export default router;
