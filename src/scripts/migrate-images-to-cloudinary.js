/**
 * Migration: move any product image or category cover that is not already on Cloudinary (inline base64
 * data URLs, or links to other hosts) to Cloudinary and replace it with the hosted URL.
 * The database must only store Cloudinary URLs (enforced by the model validators in utils/mediaUrl.js).
 *
 * Usage: node src/scripts/migrate-images-to-cloudinary.js [backup-file.json]
 * The original values are written to the backup file before any row is changed.
 */
require('dotenv').config();

const fs = require('fs');
const { sequelize, Category, ProductImage } = require('../models');
const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');
const { isCloudinaryUrl } = require('../utils/mediaUrl');

const backupPath = process.argv[2] || `data-url-backup-${Date.now()}.json`;
const baseFolder = process.env.CLOUDINARY_FOLDER || 'kunal-sarees/products';

const run = async () => {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured in .env');
  }

  const images = (await ProductImage.findAll()).filter((i) => !isCloudinaryUrl(i.imageUrl));
  const categories = (await Category.findAll()).filter((c) => c.imageUrl && !isCloudinaryUrl(c.imageUrl));
  console.log(`Found ${images.length} product image(s) and ${categories.length} category image(s) not on Cloudinary.`);
  if (images.length === 0 && categories.length === 0) return;

  fs.writeFileSync(
    backupPath,
    JSON.stringify({
      productImages: images.map((i) => ({ id: i.id, productId: i.productId, imageUrl: i.imageUrl })),
      categories: categories.map((c) => ({ id: c.id, imageUrl: c.imageUrl })),
    })
  );
  console.log(`Backup written to ${backupPath}`);

  for (const image of images) {
    const result = await cloudinary.uploader.upload(image.imageUrl, { folder: baseFolder });
    await image.update({ imageUrl: result.secure_url });
    console.log(`  product image #${image.id} (product ${image.productId}) -> ${result.secure_url}`);
  }

  for (const category of categories) {
    const result = await cloudinary.uploader.upload(category.imageUrl, { folder: `${baseFolder}/categories` });
    await category.update({ imageUrl: result.secure_url });
    console.log(`  category #${category.id} -> ${result.secure_url}`);
  }

  console.log('Done.');
};

run()
  .catch((err) => {
    console.error('Migration failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => sequelize.close());
