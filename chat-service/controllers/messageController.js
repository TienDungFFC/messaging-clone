import * as Message from '../models/Message.js';
import * as Conversation from '../models/Conversation.js';

/**
 * Get messages for a conversation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getConversationMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const currentUserId = req.user.userId;
    const { limit = 50, nextPageKey } = req.query;
    
    // Check if conversation exists
    const conversation = await Conversation.getConversationById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }
    
    // Check if user is a participant in this conversation
    if (!conversation.participantIds.includes(currentUserId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this conversation'
      });
    }
    
    // Get messages for this conversation
    const result = await Message.getByConversation(
      conversationId, 
      parseInt(limit), 
      nextPageKey
    );
    
    // Update user's last read timestamp in the conversation
    try {
      await Conversation.updateLastReadTimestamp(conversationId, currentUserId);
    } catch (err) {
      console.error('Error updating last read timestamp:', err);
      // Continue processing - non-critical error
    }
    
    if (!result || !result.messages) {
      return res.status(500).json({
        success: false,
        message: 'Error retrieving messages'
      });
    }
    
    res.status(200).json({
      success: true,
      messages: result.messages,
      nextPageKey: result.nextPageKey
    });
  } catch (error) {
    console.error('Error getting conversation messages:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving messages'
    });
  }
};

/**
 * Send a message to a conversation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content, messageType = 'text' } = req.body;
    const senderId = req.user.userId;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }
    
    // Check if conversation exists
    const conversation = await Conversation.getConversationById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }
    
    // Check if user is a participant in this conversation
    if (!conversation.participantIds.includes(senderId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this conversation'
      });
    }
    
    // Create sender information object
    const senderInfo = {
      senderName: req.user.name,
      senderAvatar: req.user.avatarUrl || ''
    };
    
    // Create the message
    const message = await Message.create(
      conversationId,
      senderId,
      content,
      messageType,
      senderInfo
    );
    
    if (!message) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send message'
      });
    }
    
    res.status(201).json({
      success: true,
      message
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending message'
    });
  }
};

/**
 * Update a message
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateMessage = async (req, res) => {
  try {
    const { conversationId, messageId } = req.params;
    const { content } = req.body;
    const currentUserId = req.user.userId;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Updated content is required'
      });
    }
    
    // Get the message
    const message = await Message.getById(conversationId, messageId);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    
    // Check if the user is the sender of the message
    if (message.senderId !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own messages'
      });
    }
    
    // Update the message
    const updatedMessage = await Message.updateContent(
      conversationId,
      messageId,
      content
    );
    
    if (!updatedMessage) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update message'
      });
    }
    
    res.status(200).json({
      success: true,
      message: updatedMessage
    });
  } catch (error) {
    console.error('Error updating message:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating message'
    });
  }
};

/**
 * Delete a message
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const deleteMessage = async (req, res) => {
  try {
    const { conversationId, messageId } = req.params;
    const currentUserId = req.user.userId;
    
    // Get the message
    const message = await Message.getById(conversationId, messageId);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    
    // Check if the user is the sender of the message
    if (message.senderId !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own messages'
      });
    }
    
    // Delete the message
    const result = await Message.delete(conversationId, messageId);
    
    if (!result) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete message'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting message'
    });
  }
};

// Không cần default export vì chúng ta đã dùng named exports
