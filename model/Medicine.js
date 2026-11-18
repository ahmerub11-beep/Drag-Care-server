'use strict';

const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: { type: String, default: 'otc' },
  categoryName: { type: String, default: 'General Medicine' },
  genericSalt: { type: String, default: 'Standard Composition' },
  manufacturer: { type: String, default: 'Drag Care Labs' },
  packSize: { type: String, default: 'Standard Pack' },
  price: { type: Number, required: true },
  originalPrice: { type: Number, required: true },
  discountPercent: { type: Number, default: 0 },
  rating: { type: Number, default: 5 },
  reviewsCount: { type: Number, default: 1 },
  isRxRequired: { type: Boolean, default: false },
  isColdChain: { type: Boolean, default: false },
  expiryDate: { type: String, default: '12/2027' },
  stockCount: { type: Number, default: 50 },
  inStock: { type: Boolean, default: true },
  isFlashDeal: { type: Boolean, default: false },
  image: { type: String, default: '' }
}, { versionKey: false, toJSON: { transform: (doc, ret) => { delete ret._id; return ret; } } });

module.exports = mongoose.models.Medicine || mongoose.model('Medicine', medicineSchema);
