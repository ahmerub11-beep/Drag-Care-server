'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./config/db');
const { authenticate } = require('./middelwares/authenticate');
const authRoutes = require('./routes/authRoutes');
const medicineRoutes = require('./routes/medicineRoutes');
const prescriptionRoutes = require('./routes/prescriptionRoutes');
const orderRoutes = require('./routes/orderRoutes');
const consultRoutes = require('./routes/consultRoutes');

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', authenticate);
app.use('/uploads/medicines', express.static(path.join(__dirname, 'uploads', 'medicines')));
app.use('/uploads', authenticate, express.static(path.join(__dirname, 'uploads')));

app.use(authRoutes);
app.use(medicineRoutes);
app.use(prescriptionRoutes);
app.use(orderRoutes);
app.use(consultRoutes);

const startServer = async () => {
  try {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`\u{1F3E5} Drag Care Pharmacy Server is running on http://localhost:${PORT}`);
  });
  } catch (error) {
  console.error(`API startup aborted: ${error.message}`);
  process.exit(1);
  }
};

startServer();
