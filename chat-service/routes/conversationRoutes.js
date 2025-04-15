import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import * as conversationController from '../controllers/conversationController.js';
import * as messageController from '../controllers/messageController.js';

const router = express.Router();

// All conversation routes require authentication
router.use(authenticate);

// Get all conversations for the current user
router.get('/', conversationController.getUserConversations);

// Create a new conversation or find existing one
router.post('/', conversationController.createOrFindConversation);

// Get conversation by ID
router.get('/:conversationId', conversationController.getConversationById);

// Mark conversation as seen - TEMPORARILY DISABLED
// router.post('/:conversationId/seen', conversationController.markConversationAsSeen);

// Get messages for a conversation
router.get('/:conversationId/messages', messageController.getConversationMessages);

// Send a message to a conversation
router.post('/:conversationId/messages', messageController.sendMessage);

// Update a message
router.put('/:conversationId/messages/:messageId', messageController.updateMessage);

// Delete a message
router.delete('/:conversationId/messages/:messageId', messageController.deleteMessage);

export default router;
