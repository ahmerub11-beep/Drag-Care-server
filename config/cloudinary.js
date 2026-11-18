const cloudinary = require('cloudinary').v2
const { randomUUID } = require('node:crypto');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

const uploadMedicineImage = (buffer) => new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
        { folder: 'drag-care/medicines', resource_type: 'image' },
        (error, result) => {
            if (error) return reject(error);
            if (!result?.secure_url) return reject(new Error('Cloudinary did not return an image URL.'));
            resolve(result.secure_url);
        }
    ).end(buffer);
});

const uploadPrescriptionFile = (buffer, originalName) => {
    const resourceType = 'image';
    const baseName = originalName
        .replace(/\.[^.]+$/, '')
        .replace(/[^a-zA-Z0-9_-]/g, '-')
        .slice(0, 60) || 'prescription';
    const publicId = `${randomUUID()}-${baseName}`;

    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            { folder: 'drag-care/prescriptions', resource_type: resourceType, public_id: publicId },
            (error, result) => {
                if (error) return reject(error);
                if (!result?.secure_url || !result.public_id) {
                    return reject(new Error('Cloudinary did not return prescription file details.'));
                }
                resolve({
                    secureUrl: result.secure_url,
                    publicId: result.public_id,
                    resourceType
                });
            }
        ).end(buffer);
    });
};

const deleteCloudinaryFile = (publicId, resourceType) => (
    cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
        invalidate: true
    })
);

const getPrescriptionFileUrl = (publicId, resourceType) => cloudinary.url(publicId, {
        resource_type: resourceType || 'image',
        type: 'upload',
        secure: true
});

module.exports = {
        cloudinary,
        uploadMedicineImage,
        uploadPrescriptionFile,
        deleteCloudinaryFile,
        getPrescriptionFileUrl
};
