import { cloudinary } from '../config/cloudinary.js';
import fs from 'fs';
import logger from '../utils/logger.js';

const uploadReceipt = async (filePath, userId) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: `udhar-khata/receipts/${userId}`,
      resource_type: 'image',
      transformation: [
        { width: 1200, height: 1200, crop: 'limit', quality: 'auto' },
      ],
    });

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return result.secure_url;
  } catch (error) {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    logger.error('Cloudinary upload error:', error.message);
    throw new Error('Failed to upload image');
  }
};

const deleteImage = async (imageUrl) => {
  try {
    const publicId = extractPublicId(imageUrl);
    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
    }
  } catch (error) {
    logger.error('Cloudinary delete error:', error.message);
  }
};

const extractPublicId = (url) => {
  const parts = url.split('/');
  const folderIndex = parts.indexOf('receipts');
  if (folderIndex === -1) return null;
  const publicIdWithExt = parts.slice(folderIndex - 1).join('/');
  return publicIdWithExt.replace(/\.[^/.]+$/, '');
};

export { uploadReceipt, deleteImage };
