const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const { Readable } = require('stream');

// 1. Multer Memory Storage: File ko RAM mein rakhega (disk pe nahi likhega)
//    Kyunki hum seedha Cloudinary pe bhejenge, local save ki zaroorat nahi
const storage = multer.memoryStorage();

// 2. File Filter: Sirf allowed file types hi accept karo
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/msword',                                                    // .doc
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true); // File accept karo
    } else {
        cb(new Error('Invalid file type! Only PDF, JPEG, PNG, WEBP, DOC, DOCX allowed.'), false);
    }
};

// 3. Multer instance banao with memory storage + filter + size limit (10MB)
const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10 MB max
});

// 4. Cloudinary pe upload karne ka helper function
//    Buffer (RAM mein rakhi file) ko stream banakar Cloudinary ko bhejta hai
const uploadToCloudinary = (fileBuffer, options = {}) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: options.folder || 'legalmind-documents',
                resource_type: options.resource_type || 'auto', // auto-detect (image, pdf, raw, etc.)
                public_id: options.public_id || undefined,
                ...options,
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            }
        );

        // Buffer ko readable stream mein convert karke Cloudinary upload stream mein pipe karo
        const readableStream = new Readable();
        readableStream.push(fileBuffer);
        readableStream.push(null); // Stream khatam
        readableStream.pipe(uploadStream);
    });
};

// 5. Cloudinary se file delete karne ka helper function
const deleteFromCloudinary = async (publicId, resourceType = 'raw') => {
    try {
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType,
        });
        return result;
    } catch (error) {
        console.error('Cloudinary delete error:', error);
        throw error;
    }
};

module.exports = { upload, uploadToCloudinary, deleteFromCloudinary };
