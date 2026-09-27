const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const isCloudinaryConfigured = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  return Boolean(
    cloudName &&
    apiKey &&
    apiSecret &&
    cloudName !== 'your_cloud_name' &&
    apiKey !== 'your_api_key' &&
    apiSecret !== 'your_api_secret'
  );
};

module.exports = {
  cloudinary,
  isCloudinaryConfigured,
};
