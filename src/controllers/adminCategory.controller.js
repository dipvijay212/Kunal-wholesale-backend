const { Category } = require('../models');
const { sendSuccess } = require('../utils/apiResponse');
const AppError = require('../utils/appError');

/**
 * POST /api/admin/categories
 * Create a new saree category
 */
const createCategory = async (req, res, next) => {
  try {
    const { name, slug, description, isActive } = req.body;

    if (!name || !slug) {
      throw new AppError('Category name and slug are required.', 400);
    }

    const existingCategory = await Category.findOne({
      where: { slug: slug.trim().toLowerCase() },
    });

    if (existingCategory) {
      throw new AppError(`Category slug '${slug}' already exists.`, 409);
    }

    const category = await Category.create({
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      description: description ? description.trim() : null,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    return sendSuccess(res, 'Category created successfully', { category }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/categories/:id
 * Update an existing category
 */
const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, slug, description, isActive } = req.body;

    const category = await Category.findByPk(id);

    if (!category) {
      throw new AppError('Category not found.', 404, { id });
    }

    if (slug && slug.trim().toLowerCase() !== category.slug) {
      const existingSlug = await Category.findOne({
        where: { slug: slug.trim().toLowerCase() },
      });
      if (existingSlug) {
        throw new AppError(`Category slug '${slug}' already exists.`, 409);
      }
      category.slug = slug.trim().toLowerCase();
    }

    if (name) category.name = name.trim();
    if (description !== undefined) category.description = description ? description.trim() : null;
    if (isActive !== undefined) category.isActive = Boolean(isActive);

    await category.save();

    return sendSuccess(res, 'Category updated successfully', { category });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/categories/:id
 * Delete category by ID
 */
const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id);

    if (!category) {
      throw new AppError('Category not found.', 404, { id });
    }

    await category.destroy();

    return sendSuccess(res, 'Category deleted successfully', { id: parseInt(id, 10) });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCategory,
  updateCategory,
  deleteCategory,
};
