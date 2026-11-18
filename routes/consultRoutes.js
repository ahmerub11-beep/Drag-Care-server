'use strict';

const express = require('express');
const router = express.Router();
const Consultation = require('../model/Consultation');
const { isDatabaseConnected } = require('../config/db');


// ==================== PHARMACIST CONSULT ====================
router.post('/api/consult', async (req, res) => {
  const { name, phone, topic, query } = req.body;
  const data = { name, phone, topic, query, receivedAt: new Date() };
  const consultation = isDatabaseConnected()
    ? await Consultation.create(data)
    : data;

  res.json({
    success: true,
    message: 'Consultation request received. On-duty pharmacist will call back shortly.',
    data: consultation
  });
});

module.exports = router;
