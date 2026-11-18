'use strict';

const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  phone: { type: String, default: '' },
  topic: { type: String, default: '' },
  query: { type: String, default: '' },
  receivedAt: { type: Date, default: Date.now }
}, { versionKey: false, toJSON: { transform: (doc, ret) => { delete ret._id; return ret; } } });

module.exports = mongoose.models.Consultation || mongoose.model('Consultation', consultationSchema);
