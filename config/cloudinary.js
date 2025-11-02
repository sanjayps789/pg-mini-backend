// backend/config/cloudinary.js
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'freelancer_hub_deliverables',
    // MODIFIED: Added 'avif' and 'webp' to the list of allowed formats
    allowed_formats: ['jpeg', 'png', 'jpg', 'pdf', 'doc', 'docx', 'zip', 'avif', 'webp'],
  },
});

export { cloudinary, storage };