/**
 * Media (images / videos) must live on Cloudinary; the database only stores the hosted URL.
 * This rejects inline base64 data URLs, blob: URLs and links to any other host.
 */
const CLOUDINARY_URL_PATTERN = /^https:\/\/res\.cloudinary\.com\/[^\s]+$/i;

const isCloudinaryUrl = (value) => typeof value === 'string' && CLOUDINARY_URL_PATTERN.test(value.trim());

const MEDIA_URL_ERROR = 'Media must be uploaded to Cloudinary; only Cloudinary URLs can be saved.';

/** Sequelize validator for a single media URL column. */
const cloudinaryUrlValidator = (value) => {
  if (value === null || value === undefined || value === '') return;
  if (!isCloudinaryUrl(value)) throw new Error(MEDIA_URL_ERROR);
};

/** Sequelize validator for a column holding one URL or a JSON array of URLs (product videos). */
const cloudinaryUrlListValidator = (value) => {
  if (value === null || value === undefined || value === '') return;
  let urls = [value];
  if (typeof value === 'string' && value.trim().startsWith('[')) {
    try {
      urls = JSON.parse(value);
    } catch {
      throw new Error(MEDIA_URL_ERROR);
    }
  }
  if (!Array.isArray(urls) || !urls.every(isCloudinaryUrl)) throw new Error(MEDIA_URL_ERROR);
};

module.exports = {
  isCloudinaryUrl,
  cloudinaryUrlValidator,
  cloudinaryUrlListValidator,
  MEDIA_URL_ERROR,
};
