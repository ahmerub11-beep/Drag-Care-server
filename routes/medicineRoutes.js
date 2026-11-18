'use strict';

const express = require('express');
const router = express.Router();
const { USERS, MEDICINES, CATEGORIES, PRESCRIPTIONS, ORDERS } = require('../data/store');
const Medicine = require('../model/Medicine');
const Order = require('../model/Order');
const Prescription = require('../model/Prescription');
const User = require('../model/User');
const { isDatabaseConnected } = require('../config/db');
const { requireRole } = require('../middelwares/authenticate');
const upload = require('../middelwares/upload');
const { uploadMedicineImage } = require('../config/cloudinary');

// ==================== MEDICINES ROUTES ====================

// Health Check
router.get('/api/health', async (req, res) => {
  const stats = isDatabaseConnected()
    ? await Promise.all([
      Medicine.estimatedDocumentCount(),
      Order.estimatedDocumentCount(),
      Prescription.estimatedDocumentCount(),
      User.estimatedDocumentCount()
    ])
    : [MEDICINES.length, ORDERS.length, PRESCRIPTIONS.length, USERS.length];

  res.json({ 
    status: 'healthy', 
    pharmacy: 'Drag Care Backend API', 
    database: isDatabaseConnected() ? 'connected' : 'in-memory',
    stats: {
      medicines: stats[0],
      orders: stats[1],
      prescriptions: stats[2],
      users: stats[3]
    },
    timestamp: new Date() 
  });
});

// Get Categories
router.get('/api/categories', (req, res) => {
  res.json(CATEGORIES);
});

// Get Medicines with Search & Filter
router.get('/api/medicines', async (req, res) => {
  const { category, search } = req.query;
  if (isDatabaseConnected()) {
    const filter = {};
    if (category && category !== 'all') {
      if (category === 'prescription') {
        filter.$or = [{ category }, { isRxRequired: true }];
      } else {
        filter.category = category;
      }
    }
    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(escapedSearch, 'i');
      filter.$or = [
        { name: searchRegex },
        { genericSalt: searchRegex },
        { manufacturer: searchRegex }
      ];
    }
    return res.json(await Medicine.find(filter));
  }

  let results = MEDICINES;

  if (category && category !== 'all') {
    results = results.filter(m =>
      m.category === category || (category === 'prescription' && m.isRxRequired)
    );
  }

  if (search) {
    const q = search.toLowerCase();
    results = results.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.genericSalt.toLowerCase().includes(q) ||
      m.manufacturer.toLowerCase().includes(q)
    );
  }

  res.json(results);
});

// Single Medicine
router.get('/api/medicines/:id', async (req, res) => {
  const med = isDatabaseConnected()
    ? await Medicine.findOne({ id: req.params.id })
    : MEDICINES.find(m => m.id === req.params.id);
  if (!med) {
    return res.status(404).json({ error: 'Medicine not found' });
  }
  res.json(med);
});

// Add Medicine (Admin & Super Admin)
router.post('/api/medicines', requireRole('admin', 'super-admin'), upload.medicineImage, async (req, res) => {
  const { name, category, genericSalt, manufacturer, price, originalPrice, stockCount, isRxRequired, isColdChain, expiryDate, packSize } = req.body;
  if (!name?.trim() || !Number.isFinite(Number(price)) || Number(price) <= 0) {
    return res.status(400).json({ error: 'Medicine name and a valid price are required.' });
  }

  let image;
  if (req.file) {
    try {
      image = await uploadMedicineImage(req.file.buffer);
    } catch (error) {
      console.error(`Medicine image upload failed: ${error.message}`);
      return res.status(502).json({ error: 'Unable to upload medicine image to Cloudinary. Please try again.' });
    }
  }

  const parseBoolean = (value) => value === true || value === 'true';
  const newMed = {
    id: 'med-' + Date.now(),
    name,
    category: category || 'otc',
    categoryName: category || 'General Medicine',
    genericSalt: genericSalt || 'Standard Composition',
    manufacturer: manufacturer || 'Drag Care Labs',
    packSize: packSize || 'Standard Pack',
    price: Number(price),
    originalPrice: originalPrice ? Number(originalPrice) : Number(price) * 1.15,
    discountPercent: originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0,
    rating: 5.0,
    reviewsCount: 1,
    isRxRequired: parseBoolean(isRxRequired),
    isColdChain: parseBoolean(isColdChain),
    expiryDate: expiryDate || '12/2027',
    stockCount: stockCount ? Number(stockCount) : 50,
    inStock: true,
    isFlashDeal: false,
    image: image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80'
  };

  const medicine = isDatabaseConnected()
    ? await Medicine.create(newMed)
    : (MEDICINES.unshift(newMed), newMed);
  res.status(201).json({ success: true, message: 'Medicine added to inventory', medicine });
});

// Update Medicine (Admin & Super Admin)
router.put('/api/medicines/:id', requireRole('admin', 'super-admin'), upload.medicineImage, async (req, res) => {
  const { name, category, genericSalt, manufacturer, packSize, price, originalPrice, stockCount, isRxRequired, isColdChain, expiryDate } = req.body;
  const currentMedicine = isDatabaseConnected()
    ? await Medicine.findOne({ id: req.params.id })
    : MEDICINES.find(m => m.id === req.params.id);
  if (!currentMedicine) return res.status(404).json({ error: 'Medicine not found' });

  const updatedPrice = price === undefined ? currentMedicine.price : Number(price);
  const updatedOriginalPrice = originalPrice === undefined || originalPrice === ''
    ? updatedPrice
    : Number(originalPrice);
  const updatedStockCount = stockCount === undefined ? currentMedicine.stockCount : Number(stockCount);
  if (!name?.trim() || !Number.isFinite(updatedPrice) || updatedPrice <= 0
    || !Number.isFinite(updatedOriginalPrice) || updatedOriginalPrice < 0
    || !Number.isFinite(updatedStockCount) || updatedStockCount < 0) {
    return res.status(400).json({ error: 'Enter a medicine name, valid price, and non-negative stock quantity.' });
  }

  const updates = {
    name: name.trim(),
    category,
    genericSalt,
    manufacturer,
    packSize,
    price: updatedPrice,
    originalPrice: updatedOriginalPrice,
    discountPercent: updatedOriginalPrice > 0
      ? Math.max(0, Math.round(((updatedOriginalPrice - updatedPrice) / updatedOriginalPrice) * 100))
      : 0,
    stockCount: updatedStockCount,
    inStock: updatedStockCount > 0,
    isRxRequired: isRxRequired === true || isRxRequired === 'true',
    isColdChain: isColdChain === true || isColdChain === 'true',
    expiryDate
  };
  Object.keys(updates).forEach((key) => {
    if (updates[key] === undefined) delete updates[key];
  });
  if (req.file) {
    try {
      updates.image = await uploadMedicineImage(req.file.buffer);
    } catch (error) {
      console.error(`Medicine image upload failed: ${error.message}`);
      return res.status(502).json({ error: 'Unable to upload medicine image to Cloudinary. Please try again.' });
    }
  }

  const medicine = isDatabaseConnected()
    ? await Medicine.findOneAndUpdate({ id: req.params.id }, updates, { new: true, runValidators: true })
    : Object.assign(currentMedicine, updates);
  res.json({ success: true, message: 'Medicine updated successfully', medicine });
});

// Delete Medicine (Admin & Super Admin)
router.delete('/api/medicines/:id', requireRole('admin', 'super-admin'), async (req, res) => {
  let deleted;
  if (isDatabaseConnected()) {
    deleted = await Medicine.findOneAndDelete({ id: req.params.id });
  } else {
    const index = MEDICINES.findIndex(m => m.id === req.params.id);
    if (index !== -1) deleted = MEDICINES.splice(index, 1)[0];
  }
  if (!deleted) return res.status(404).json({ error: 'Medicine not found' });
  res.json({ success: true, message: `${deleted.name} deleted from inventory` });
});

module.exports = router;
