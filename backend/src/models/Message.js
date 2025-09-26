const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false  // Not always required for room messages
  },
  content: {
    type: String,
    required: false
  },
  encryptedContent: {
    type: String,
    required: false  // Either content or encryptedContent should be present
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'system'],
    default: 'text'
  },
  messageId: {
    type: String,
    required: false,  // Can be auto-generated
    unique: true,
    sparse: true  // Allow null values to be non-unique
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  deliveryStatus: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: false // Optional for direct messages
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
});

// Validation: Either room or recipient must be provided
messageSchema.pre('validate', function(next) {
  if (!this.room && !this.recipient) {
    return next(new Error('Either room or recipient must be provided'));
  }
  next();
});

// Generate messageId if not provided
messageSchema.pre('save', function(next) {
  if (!this.messageId) {
    this.messageId = require('crypto').randomBytes(16).toString('hex');
  }
  next();
});

// Indexes for performance
messageSchema.index({ sender: 1, timestamp: -1 });
messageSchema.index({ recipient: 1, timestamp: -1 });
messageSchema.index({ room: 1, timestamp: -1 });

// Method to mark as delivered
messageSchema.methods.markDelivered = function() {
  this.deliveryStatus = 'delivered';
  return this.save();
};

// Method to mark as read
messageSchema.methods.markRead = function() {
  this.deliveryStatus = 'read';
  return this.save();
};

// Static method to find messages between users
messageSchema.statics.findBetweenUsers = function(user1, user2, limit = 50) {
  return this.find({
    $or: [
      { sender: user1, recipient: user2 },
      { sender: user2, recipient: user1 }
    ]
  })
  .sort({ timestamp: -1 })
  .limit(limit);
};

module.exports = mongoose.model('Message', messageSchema);