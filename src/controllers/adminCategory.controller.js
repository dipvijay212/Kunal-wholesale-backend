const { Category } = require('../models');
const { sendSuccess } = require('../utils/apiResponse');
const AppError = require('../utils/appError');

/**
 * POST /api/admin/categories
 * Create a new saree category
 */
const createCategory = async (req, res, next) => {
  try {
    const { name, name_en, nameEn, name_hi, nameHi, slug, description, description_en, descriptionEn, description_hi, descriptionHi, isActive } = req.body;

    const finalNameHi = name_hi || nameHi || name;
    const finalNameEn = name_en || nameEn || name;
    const finalName = finalNameHi || finalNameEn;

    if (!finalName || !slug) {
      throw new AppError('Category name and slug are required.', 400);
    }

    const existingCategory = await Category.findOne({
      where: { slug: slug.trim().toLowerCase() },
    });

    if (existingCategory) {
      throw new AppError(`Category slug '${slug}' already exists.`, 409);
    }

    const category = await Category.create({
      name: finalName.trim(),
      nameEn: finalNameEn ? finalNameEn.trim() : finalName.trim(),
      nameHi: finalNameHi ? finalNameHi.trim() : finalName.trim(),
      slug: slug.trim().toLowerCase(),
      description: description ? description.trim() : (description_hi || descriptionHi || description_en || descriptionEn || null),
      descriptionEn: description_en || descriptionEn || (description ? description.trim() : null),
      descriptionHi: description_hi || descriptionHi || (description ? description.trim() : null),
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
    const { name, name_en, nameEn, name_hi, nameHi, slug, description, description_en, descriptionEn, description_hi, descriptionHi, isActive } = req.body;

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

    if (name) {
      const trimmed = name.trim();
      category.name = trimmed;
      category.nameEn = (name_en || nameEn || trimmed).trim();
      category.nameHi = (name_hi || nameHi || trimmed).trim();
    } else {
      if (name_en !== undefined || nameEn !== undefined) category.nameEn = (name_en || nameEn || '').trim() || null;
      if (name_hi !== undefined || nameHi !== undefined) category.nameHi = (name_hi || nameHi || '').trim() || null;
    }

    if (description !== undefined) {
      const d = description ? description.trim() : null;
      category.description = d;
      category.descriptionEn = (description_en !== undefined || descriptionEn !== undefined) ? (description_en || descriptionEn || '').trim() || null : d;
      category.descriptionHi = (description_hi !== undefined || descriptionHi !== undefined) ? (description_hi || descriptionHi || '').trim() || null : d;
    } else {
      if (description_en !== undefined || descriptionEn !== undefined) category.descriptionEn = (description_en || descriptionEn || '').trim() || null;
      if (description_hi !== undefined || descriptionHi !== undefined) category.descriptionHi = (description_hi || descriptionHi || '').trim() || null;
    }
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
