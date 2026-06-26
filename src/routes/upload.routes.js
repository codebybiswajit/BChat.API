import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
  api_key: process.env.CLOUDINARY_API_KEY || '123456789',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'secret123',
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'chatapp',
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'mp4', 'pdf'],
    resource_type: 'auto',
  },
});

const upload = multer({ storage: storage });

router.post('/', protect, upload.single('media'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  
  res.json({
    url: req.file.path,
    type: req.file.mimetype.split('/')[0] === 'video' ? 'video' : 'image', // simplified for demo
  });
});

export default router;
