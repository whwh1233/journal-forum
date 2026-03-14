const Notification = require('../models/Notification');

class NotificationService {
  /**
   * Create a notification. Silently skips if sender === recipient.
   * Never throws — logs errors to prevent blocking business logic.
   */
  async create({ recipientId, senderId = null, type, entityType = null, entityId = null, content = {} }) {
    try {
      // Don't notify yourself
      if (senderId && senderId === recipientId) {
        return null;
      }

      const notification = await Notification.create({
        recipientId,
        senderId,
        type,
        entityType,
        entityId,
        content
      });

      return notification;
    } catch (error) {
      console.error(`[NotificationService] Failed to create notification (type=${type}):`, error.message);
      return null;
    }
  }

  /**
   * Create notifications for multiple recipients.
   * Used for fan-out scenarios (e.g., journal_new_comment to all who favorited).
   */
  async createBulk(recipientIds, { senderId = null, type, entityType = null, entityId = null, content = {} }) {
    const results = [];
    for (const recipientId of recipientIds) {
      const result = await this.create({ recipientId, senderId, type, entityType, entityId, content });
      if (result) results.push(result);
    }
    return results;
  }
}

module.exports = new NotificationService();
