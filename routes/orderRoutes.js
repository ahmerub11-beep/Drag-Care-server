'use strict';

const express = require('express');
const router = express.Router();
const { ORDERS } = require('../data/store');
const Order = require('../model/Order');
const { isDatabaseConnected } = require('../config/db');
const { requireRole } = require('../middelwares/authenticate');

// ==================== ORDERS ROUTES ====================

// Get All Orders (Admin & Super Admin)
router.get('/api/orders', requireRole('admin', 'super-admin'), async (req, res) => {
  const orders = isDatabaseConnected()
    ? await Order.find().sort({ createdAt: -1 })
    : ORDERS;
  res.json(orders);
});

// Place Order
router.post('/api/orders', async (req, res) => {
  const { items, customer, deliverySpeed, paymentMethod, total } = req.body;

  const orderRecord = {
    id: 'DRAG-ORD-' + Math.floor(100000 + Math.random() * 900000),
    items: items || [],
    customer: customer || {},
    deliverySpeed: deliverySpeed || 'standard',
    paymentMethod: paymentMethod || 'cod',
    paymentStatus: 'Pending',
    total: total || 0,
    status: 'Processing at Central Dispensary',
    createdAt: new Date()
  };

  const order = isDatabaseConnected()
    ? await Order.create(orderRecord)
    : (ORDERS.unshift(orderRecord), orderRecord);

  res.status(201).json({
    success: true,
    message: 'Order placed successfully',
    order
  });
});

// Update Order Status (Admin & Super Admin)
router.put('/api/orders/:id/status', requireRole('admin', 'super-admin'), async (req, res) => {
  const { status } = req.body;
  const paymentStatus = status?.toLowerCase().includes('delivered') ? 'Paid' : 'Pending';
  const order = isDatabaseConnected()
    ? await Order.findOneAndUpdate({ id: req.params.id }, { status, paymentStatus }, { new: true, runValidators: true })
    : ORDERS.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  if (!isDatabaseConnected()) {
    order.status = status;
    order.paymentStatus = paymentStatus;
  }
  res.json({ success: true, message: `Order status updated to: ${status}`, order });
});

// Delete Order (Admin & Super Admin)
router.delete('/api/orders/:id', requireRole('admin', 'super-admin'), async (req, res) => {
  let deleted;
  if (isDatabaseConnected()) {
    deleted = await Order.findOneAndDelete({ id: req.params.id });
  } else {
    const index = ORDERS.findIndex((order) => order.id === req.params.id);
    if (index !== -1) deleted = ORDERS.splice(index, 1)[0];
  }

  if (!deleted) {
    return res.status(404).json({ error: 'Order not found' });
  }

  res.json({ success: true, message: `Order ${deleted.id} removed successfully` });
});

module.exports = router;
