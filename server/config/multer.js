require('dotenv').config(); 
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

// 🔥 EXPERT FIX 1: Smart Import (Ye dono versions ke liye kaam karega)
const multerStorage = require('multer-storage-cloudinary');
const CloudinaryStorage = multerStorage.CloudinaryStorage || multerStorage;

// 1. Cloudinary Setup
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// 2. Storage Config
const storage = new CloudinaryStorage({
  // 🔥 EXPERT FIX 2: Root object pass kar rahe hain taaki "v2.v2" wala crash na aaye
  cloudinary: require('cloudinary'), 
  params: {
    folder: 'eventora_banners',
    allowedFormats: ['jpeg', 'png', 'jpg', 'webp'],
  },
});

const upload = multer({ storage: storage });
module.exports = upload;