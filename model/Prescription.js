'use strict';

const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  patientName: { type: String, default: 'Patient' },
  phone: { type: String, default: '' },
  city: { type: String, default: 'Lahore' },
  address: { type: String, default: '' },
  notes: { type: String, default: '' },
  fileName: { type: String, default: 'Prescription image' },
  filePath: { type: String, default: null },
  filePublicId: { type: String, default: null },
  fileResourceType: { type: String, default: null },
  fileType: { type: String, default: null },
  status: { type: String, default: 'Pending Verification' },
  createdAt: { type: Date, default: Date.now }
}, { versionKey: false, toJSON: { transform: (doc, ret) => { delete ret._id; return ret; } } });

module.exports = mongoose.models.Prescription || mongoose.model('Prescription', prescriptionSchema);
