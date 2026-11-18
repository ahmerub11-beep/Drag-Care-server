'use strict';

const multer = require('multer');

const allowedPrescriptionTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
]);

const prescriptionUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!allowedPrescriptionTypes.has(file.mimetype)) {
      const error = new Error('Please upload a PNG, JPG, WEBP, or GIF prescription image.');
      error.status = 400;
      return cb(error);
    }
    cb(null, true);
  }
});

const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const medicineImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!allowedImageTypes.has(file.mimetype)) {
      const error = new Error('Please upload a PNG, JPG, WEBP, or GIF image.');
      error.status = 400;
      return cb(error);
    }
    cb(null, true);
  }
});

prescriptionUpload.medicineImage = (req, res, next) => {
  medicineImageUpload.single('image')(req, res, (error) => {
    if (!error) return next();
    if (!(error instanceof multer.MulterError) && error.status !== 400) return next(error);
    const message = error.code === 'LIMIT_FILE_SIZE'
      ? 'Image must be 5 MB or smaller.'
      : error.message || 'Unable to upload medicine image.';
    res.status(400).json({ error: message });
  });
};

prescriptionUpload.prescriptionFile = (req, res, next) => {
  prescriptionUpload.single('prescriptionFile')(req, res, (error) => {
    if (!error) return next();
    if (!(error instanceof multer.MulterError) && error.status !== 400) return next(error);
    const message = error.code === 'LIMIT_FILE_SIZE'
      ? 'Prescription file must be 10 MB or smaller.'
      : error.message || 'Unable to upload prescription file.';
    res.status(400).json({ error: message });
  });
};

module.exports = prescriptionUpload;
