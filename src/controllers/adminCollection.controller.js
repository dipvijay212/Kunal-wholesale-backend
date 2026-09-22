const { Collection } = require('../models');
const { sendSuccess } = require('../utils/apiResponse');
const AppError = require('../utils/appError');

/**
 * POST /api/admin/collections
 * Create a new collection
 */
const createCollection = async (req, res, next) => {
  try {
    const { name, slug, description, image, isActive } = req.body;

    if (!name || !slug) {
      throw new AppError('Collection name and slug are required.', 400);
    }

    const existingCollection = await Collection.findOne({
      where: { slug: slug.trim().toLowerCase() },
    });

    if (existingCollection) {
      throw new AppError(`Collection slug '${slug}' already exists.`, 409);
    }

    const collection = await Collection.create({
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      description: description ? description.trim() : null,
      image: image ? image.trim() : null,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    return sendSuccess(res, 'Collection created successfully', { collection }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/collections/:id
 * Update an existing collection
 */
const updateCollection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, slug, description, image, isActive } = req.body;

    const collection = await Collection.findByPk(id);

    if (!collection) {
      throw new AppError('Collection not found.', 404, { id });
    }

    if (slug && slug.trim().toLowerCase() !== collection.slug) {
      const existingSlug = await Collection.findOne({
        where: { slug: slug.trim().toLowerCase() },
      });
      if (existingSlug) {
        throw new AppError(`Collection slug '${slug}' already exists.`, 409);
      }
      collection.slug = slug.trim().toLowerCase();
    }

    if (name) collection.name = name.trim();
    if (description !== undefined) collection.description = description ? description.trim() : null;
    if (image !== undefined) collection.image = image ? image.trim() : null;
    if (isActive !== undefined) collection.isActive = Boolean(isActive);

    await collection.save();

    return sendSuccess(res, 'Collection updated successfully', { collection });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/collections/:id
 * Delete collection by ID
 */
const deleteCollection = async (req, res, next) => {
  try {
    const { id } = req.params;

    const collection = await Collection.findByPk(id);

    if (!collection) {
      throw new AppError('Collection not found.', 404, { id });
    }

    await collection.destroy();

    return sendSuccess(res, 'Collection deleted successfully', { id: parseInt(id, 10) });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCollection,
  updateCollection,
  deleteCollection,
};
