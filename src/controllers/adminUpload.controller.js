const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');
const { sendSuccess } = require('../utils/apiResponse');
const AppError = require('../utils/appError');

/**
 * Helper to upload buffer to Cloudinary via stream
 */
const uploadBufferToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: process.env.CLOUDINARY_FOLDER || 'kunal-sarees/products',
        ...options,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
};

/**
 * POST /api/admin/upload/images
 * Upload multiple product images to Cloudinary
 */
const uploadImages = async (req, res, next) => {
  try {
    if (!isCloudinaryConfigured()) {
      throw new AppError(
        'Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in backend .env file.',
        503
      );
    }

    const files = req.files;
    if (!files || files.length === 0) {
      throw new AppError('No image files provided for upload.', 400);
    }

    // Upload each image buffer concurrently to Cloudinary
    const uploadPromises = files.map((file) =>
      uploadBufferToCloudinary(file.buffer, {
        resource_type: 'image',
        quality: 'auto',
        fetch_format: 'auto',
      })
    );

    const results = await Promise.all(uploadPromises);

    const uploadedImages = results.map((result) => ({
      url: result.secure_url || result.url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    }));

    return sendSuccess(
      res,
      `Successfully uploaded ${uploadedImages.length} image(s) to Cloudinary`,
      {
        urls: uploadedImages.map((img) => img.url),
        images: uploadedImages,
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/upload/video
 * Upload product video to Cloudinary
 */
const uploadVideo = async (req, res, next) => {
  try {
    if (!isCloudinaryConfigured()) {
      throw new AppError(
        'Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in backend .env file.',
        503
      );
    }

    const file = req.file;
    if (!file) {
      throw new AppError('No video file provided for upload.', 400);
    }

    const result = await uploadBufferToCloudinary(file.buffer, {
      resource_type: 'video',
    });

    return sendSuccess(
      res,
      'Product video successfully uploaded to Cloudinary',
      {
        url: result.secure_url || result.url,
        publicId: result.public_id,
        duration: result.duration,
        format: result.format,
        bytes: result.bytes,
        width: result.width,
        height: result.height,
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/upload/media
 * Delete media from Cloudinary by public ID
 */
const deleteMedia = async (req, res, next) => {
  try {
    if (!isCloudinaryConfigured()) {
      throw new AppError('Cloudinary is not configured.', 503);
    }

    const { publicId, resourceType = 'image' } = req.body;
    if (!publicId) {
      throw new AppError('Public ID is required to delete media from Cloudinary.', 400);
    }

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    return sendSuccess(res, 'Media deleted from Cloudinary successfully', { result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadImages,
  uploadVideo,
  deleteMedia,
};
