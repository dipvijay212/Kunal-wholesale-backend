const multer = require('multer');
const AppError = require('../utils/appError');

// Memory storage keeps uploaded files in RAM as Buffers for streaming directly to Cloudinary
const storage = multer.memoryStorage();

// Allowed MIME types
const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/avif'];
const allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-matroska', 'video/ogg'];

const imageFileFilter = (req, file, cb) => {
  if (allowedImageTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(`Unsupported image format (${file.mimetype}). Allowed formats: JPEG, PNG, WEBP, AVIF.`, 400), false);
  }
};

const videoFileFilter = (req, file, cb) => {
  if (allowedVideoTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(`Unsupported video format (${file.mimetype}). Allowed formats: MP4, WEBM, MOV.`, 400), false);
  }
};

// Multer upload configurations
const uploadMultipleImages = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit per image
    files: 10,                  // Up to 10 images at once
  },
  fileFilter: imageFileFilter,
}).array('images', 10);

const uploadSingleImage = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit
  },
  fileFilter: imageFileFilter,
}).single('image');

const uploadSingleVideo = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit per video
  },
  fileFilter: videoFileFilter,
}).single('video');

module.exports = {
  uploadMultipleImages,
  uploadSingleImage,
  uploadSingleVideo,
};
