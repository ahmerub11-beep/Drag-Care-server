'use strict';

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true, select: false },
  passwordResetTokenHash: { type: String, select: false },
  passwordResetExpiresAt: { type: Date, select: false },
  role: { type: String, enum: ['user', 'admin', 'super-admin'], default: 'user' },
  phone: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
}, {
  versionKey: false,
  toJSON: {
    transform: (doc, ret) => {
      delete ret._id;
      delete ret.passwordHash;
      return ret;
    }
  }
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
