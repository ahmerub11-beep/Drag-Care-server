'use strict';

const express = require('express');
const router = express.Router();
const { PRESCRIPTIONS } = require('../data/store');
const Prescription = require('../model/Prescription');
const { isDatabaseConnected } = require('../config/db');
const upload = require('../middelwares/upload');
const { requireRole } = require('../middelwares/authenticate');
const {
  uploadPrescriptionFile,
  deleteCloudinaryFile,
  getPrescriptionFileUrl
} = require('../config/cloudinary');

const serializePrescription = (prescription) => {
  const record = prescription.toObject ? prescription.toObject() : prescription;
  const { id, patientName, phone, city, address, notes, fileName, fileType, status, createdAt } = record;
  return { id, patientName, phone, city, address, notes, fileName, fileType, status, createdAt };
};

// ==================== PRESCRIPTION ROUTES ====================

// Get All Prescriptions (Admin & Super Admin)
router.get('/api/prescriptions', requireRole('admin', 'super-admin'), async (req, res) => {
  const prescriptions = isDatabaseConnected()
    ? await Prescription.find().sort({ createdAt: -1 })
    : PRESCRIPTIONS;
  res.json(prescriptions.map(serializePrescription));
});

// Upload Prescription
router.post('/api/prescriptions', upload.prescriptionFile, async (req, res) => {
  const { patientName, phone, city, address, notes } = req.body;
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: 'Please attach a prescription image.' });
  }

  let uploadedFile;
  try {
    uploadedFile = await uploadPrescriptionFile(file.buffer, file.originalname);
  } catch (error) {
    console.error(`Prescription upload to Cloudinary failed: ${error.message}`);
    return res.status(502).json({ error: 'Unable to store the prescription in Cloudinary. Please try again.' });
  }

  const rxRecord = {
    id: 'DRAG-RX-' + Math.floor(100000 + Math.random() * 900000),
    patientName: patientName || 'Patient',
    phone: phone || '',
    city: city || 'Lahore',
    address: address || '',
    notes: notes || '',
    fileName: file.originalname,
    filePath: uploadedFile.secureUrl,
    filePublicId: uploadedFile.publicId,
    fileResourceType: uploadedFile.resourceType,
    fileType: file.mimetype,
    status: 'Pending Verification',
    createdAt: new Date()
  };

  let prescription;
  try {
    prescription = isDatabaseConnected()
      ? await Prescription.create(rxRecord)
      : (PRESCRIPTIONS.unshift(rxRecord), rxRecord);
  } catch (error) {
    try {
      await deleteCloudinaryFile(uploadedFile.publicId, uploadedFile.resourceType);
    } catch (cleanupError) {
      console.error(`Orphaned prescription file cleanup failed: ${cleanupError.message}`);
    }
    console.error(`Prescription record could not be saved: ${error.message}`);
    return res.status(500).json({ error: 'Unable to save prescription details. Please try again.' });
  }

  res.status(201).json({
    success: true,
    message: 'Prescription uploaded successfully. A pharmacist will review shortly.',
    prescription: serializePrescription(prescription)
  });
});

// Serve prescription files only to pharmacy staff; the Cloudinary URL stays private.
router.get('/api/prescriptions/:id/file', requireRole('admin', 'super-admin'), async (req, res) => {
  const prescription = isDatabaseConnected()
    ? await Prescription.findOne({ id: req.params.id })
    : PRESCRIPTIONS.find((item) => item.id === req.params.id);
  if (!prescription?.filePath) {
    return res.status(404).json({ error: 'Prescription file not found.' });
  }

  try {
    const storedCloudinaryUrl = prescription.filePath && prescription.filePath.startsWith('https://res.cloudinary.com/');
    if (!storedCloudinaryUrl && !(prescription.filePublicId && prescription.fileResourceType)) {
      return res.status(404).json({ error: 'Prescription file is unavailable. Please ask the patient to upload it again.' });
    }

    const fileUrl = storedCloudinaryUrl
      ? prescription.filePath
      : getPrescriptionFileUrl(prescription.filePublicId, prescription.fileResourceType);
    const parsedFileUrl = new URL(fileUrl);
    if (parsedFileUrl.protocol !== 'https:' || !parsedFileUrl.hostname.endsWith('.cloudinary.com')) {
      return res.status(404).json({ error: 'Prescription file is unavailable. Please ask the patient to upload it again.' });
    }

    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) {
      console.error(`Cloudinary prescription fetch failed with status ${fileResponse.status}.`);
      return res.status(502).json({
        error: `Cloudinary could not open this file (HTTP ${fileResponse.status}). Please ask the patient to upload it again.`
      });
    }

    const fileBuffer = Buffer.from(await fileResponse.arrayBuffer());
    const safeFileName = prescription.fileName.replace(/["\r\n]/g, '_');
    res.set({
      'Content-Type': prescription.fileType || 'application/octet-stream',
      'Content-Disposition': `inline; filename="${safeFileName}"`,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, no-store'
    });
    return res.send(fileBuffer);
  } catch (error) {
    console.error(`Prescription file retrieval failed: ${error.message}`);
    return res.status(502).json({ error: 'Unable to retrieve the prescription file.' });
  }
});

// Update Prescription Status (Admin & Super Admin)
router.put('/api/prescriptions/:id/status', requireRole('admin', 'super-admin'), async (req, res) => {
  const { status } = req.body;
  const rx = isDatabaseConnected()
    ? await Prescription.findOneAndUpdate(
      { id: req.params.id },
      { status: status || 'Verified by Pharmacist' },
      { new: true, runValidators: true }
    )
    : PRESCRIPTIONS.find(p => p.id === req.params.id);
  if (!rx) return res.status(404).json({ error: 'Prescription not found' });

  if (!isDatabaseConnected()) rx.status = status || 'Verified by Pharmacist';
  res.json({
    success: true,
    message: `Prescription status updated to: ${rx.status}`,
    prescription: serializePrescription(rx)
  });
});

// Delete Prescription (Admin & Super Admin)
router.delete('/api/prescriptions/:id', requireRole('admin', 'super-admin'), async (req, res) => {
  const prescription = isDatabaseConnected()
    ? await Prescription.findOne({ id: req.params.id })
    : PRESCRIPTIONS.find((item) => item.id === req.params.id);
  if (!prescription) return res.status(404).json({ error: 'Prescription not found.' });

  if (prescription.filePublicId && prescription.fileResourceType) {
    try {
      const result = await deleteCloudinaryFile(prescription.filePublicId, prescription.fileResourceType);
      if (!['ok', 'not found'].includes(result.result)) {
        console.error(`Cloudinary prescription deletion returned: ${result.result}`);
        return res.status(502).json({ error: 'Unable to delete the prescription file from Cloudinary.' });
      }
    } catch (error) {
      console.error(`Prescription deletion from Cloudinary failed: ${error.message}`);
      return res.status(502).json({ error: 'Unable to delete the prescription file from Cloudinary.' });
    }
  }

  if (isDatabaseConnected()) {
    await Prescription.deleteOne({ id: req.params.id });
  } else {
    const index = PRESCRIPTIONS.findIndex((item) => item.id === req.params.id);
    if (index !== -1) PRESCRIPTIONS.splice(index, 1);
  }
  return res.json({ success: true, message: 'Prescription deleted successfully.' });
});

module.exports = router;
