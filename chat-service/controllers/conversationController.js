import * as Conversation from '../models/Conversation.js';
import * as User from '../models/User.js';

/**
 * Get all conversations for the current user
 */
export const getUserConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversations = await Conversation.getConversationsByUser(userId);

    for (const conversation of conversations) {
      if (conversation.type === 'direct') {
        const otherParticipantId = conversation.participantIds.find(id => id !== userId);
        if (otherParticipantId) {
          const otherUser = await User.getById(otherParticipantId);
          if (otherUser) {
            conversation.name = otherUser.name;
            conversation.otherUser = {
              id: otherUser.userId,
              name: otherUser.name,
              avatarUrl: otherUser.avatarUrl
            };
          }
        }
      }
    }

    res.status(200).json({
      success: true,
      conversations
    });
  } catch (error) {
    console.error('Error getting user conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving conversations'
    });
  }
};

/**
 * Create a new conversation or find existing one
 */
export const createOrFindConversation = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const { participantIds, name, isGroup = false } = req.body;

    if (!participantIds || !Array.isArray(participantIds)) {
      return res.status(400).json({
        success: false,
        message: 'Participant IDs array is required'
      });
    }

    const allParticipantIds = [...new Set([currentUserId, ...participantIds])];
    let conversation;

    if (!isGroup && allParticipantIds.length === 2) {
      conversation = await Conversation.findConversationByParticipants(allParticipantIds);

      if (conversation) {
        const otherUserId = allParticipantIds.find(id => id !== currentUserId);
        if (otherUserId) {
          const otherUser = await User.getById(otherUserId);
          if (otherUser) {
            conversation.name = otherUser.name;
            conversation.otherUser = {
              id: otherUser.userId,
              name: otherUser.name,
              avatarUrl: otherUser.avatarUrl
            };
          }
        }

        return res.status(200).json({
          success: true,
          conversation,
          created: false
        });
      }
    }

    const conversationType = isGroup ? 'group' : 'direct';
    let conversationName = name || '';

    if (!isGroup && !name && allParticipantIds.length === 2) {
      const otherUserId = allParticipantIds.find(id => id !== currentUserId);
      if (otherUserId) {
        const otherUser = await User.getById(otherUserId);
        if (otherUser) {
          conversationName = otherUser.name;
        }
      }
    }

    conversation = await Conversation.createConversation(allParticipantIds, conversationName, conversationType);

    if (!conversation) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create conversation'
      });
    }

    if (conversationType === 'direct' && allParticipantIds.length === 2) {
      const otherUserId = allParticipantIds.find(id => id !== currentUserId);
      if (otherUserId) {
        const otherUser = await User.getById(otherUserId);
        if (otherUser) {
          conversation.name = otherUser.name;
          conversation.otherUser = {
            id: otherUser.userId,
            name: otherUser.name,
            avatarUrl: otherUser.avatarUrl
          };
        }
      }
    }

    res.status(201).json({
      success: true,
      conversation,
      created: true
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating conversation'
    });
  }
};

/**
 * Get conversation by ID
 */
export const getConversationById = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const currentUserId = req.user.userId;

    const conversation = await Conversation.getConversationById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    if (!conversation.participantIds.includes(currentUserId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this conversation'
      });
    }

    if (conversation.type === 'direct' && conversation.participantIds.length === 2) {
      const otherUserId = conversation.participantIds.find(id => id !== currentUserId);
      if (otherUserId) {
        const otherUser = await User.getById(otherUserId);
        if (otherUser) {
          conversation.name = otherUser.name;
          conversation.otherUser = {
            id: otherUser.userId,
            name: otherUser.name,
            avatarUrl: otherUser.avatarUrl
          };
        }
      }
    }

    res.status(200).json({
      success: true,
      conversation
    });
  } catch (error) {
    console.error('Error getting conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving conversation'
    });
  }
};

/**
 * Mark conversation as seen - TEMPORARILY DISABLED
 */
/*
export const markConversationAsSeen = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const currentUserId = req.user.userId;

    const conversation = await Conversation.getById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    if (!conversation.participantIds.includes(currentUserId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this conversation'
      });
    }

    const timestamp = new Date().toISOString();
    await Conversation.updateLastReadTimestamp(conversationId, currentUserId, timestamp);

    res.status(200).json({
      success: true,
      message: 'Conversation marked as seen'
    });
  } catch (error) {
    console.error('Error marking conversation as seen:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking conversation as seen'
    });
  }
};
*/
