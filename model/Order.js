'use strict';

const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  items: { type: [mongoose.Schema.Types.Mixed], default: [] },
  customer: { type: mongoose.Schema.Types.Mixed, default: {} },
  deliverySpeed: { type: String, default: 'standard' },
  paymentMethod: { type: String, default: 'cod' },
  paymentStatus: { type: String, default: 'Pending' },
  total: { type: Number, default: 0 },
  status: { type: String, default: 'Processing at Central Dispensary' },
  createdAt: { type: Date, default: Date.now }
}, { versionKey: false, toJSON: { transform: (doc, ret) => { delete ret._id; return ret; } } });

module.exports = mongoose.models.Order || mongoose.model('Order', orderSchema);
