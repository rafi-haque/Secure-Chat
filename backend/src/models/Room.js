const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 100
  },
  participants: [{
    type: String,
    required: true
  }],
  createdBy: {
    type: String,
    required: true
  },
  isPrivate: {
    type: Boolean,
    default: true
  },
  passcode: {
    type: String,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
});

// Index for faster room lookups
roomSchema.index({ participants: 1 });
roomSchema.index({ createdAt: -1 });

// Method to add participant
roomSchema.methods.addParticipant = function(username) {
  if (!this.participants.includes(username)) {
    this.participants.push(username);
    this.lastActivity = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to remove participant
roomSchema.methods.removeParticipant = function(username) {
  this.participants = this.participants.filter(p => p !== username);
  this.lastActivity = new Date();
  return this.save();
};

module.exports = mongoose.model('Room', roomSchema);