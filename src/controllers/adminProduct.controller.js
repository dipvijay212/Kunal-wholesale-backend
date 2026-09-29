const { Op } = require('sequelize');
const { Product, Category, ProductImage, sequelize } = require('../models');
const { sendSuccess } = require('../utils/apiResponse');
const AppError = require('../utils/appError');
const { getPagination, getSortOrder, getPaginationMeta } = require('../utils/queryHelpers');

/**
 * Automatically ensures a slug is unique by appending -2, -3, etc.
 * Prevents errors when adding sarees with the same name.
 */
async function generateUniqueSlug(baseSlug, excludeProductId = null, transaction = null) {
  let cleanSlug = (baseSlug || 'saree')
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  if (!cleanSlug) cleanSlug = 'saree';

  let candidateSlug = cleanSlug;
  let counter = 1;

  while (true) {
    const whereClause = { slug: candidateSlug };
    if (excludeProductId) {
      whereClause.id = { [Op.ne]: excludeProductId };
    }

    const existing = await Product.findOne({
      where: whereClause,
      attributes: ['id'],
      transaction,
    });

    if (!existing) {
      return candidateSlug;
    }

    counter++;
    candidateSlug = `${cleanSlug}-${counter}`;
  }
}

/**
 * Automatically ensures a productCode is unique by appending -2, -3, etc.
 */
async function generateUniqueProductCode(baseCode, excludeProductId = null, transaction = null) {
  let cleanCode = (baseCode || 'KS-SAREE')
    .toString()
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]+/g, '');

  if (!cleanCode) cleanCode = 'KS-SAREE';

  let candidateCode = cleanCode;
  let counter = 1;

  while (true) {
    const whereClause = { productCode: candidateCode };
    if (excludeProductId) {
      whereClause.id = { [Op.ne]: excludeProductId };
    }

    const existing = await Product.findOne({
      where: whereClause,
      attributes: ['id'],
      transaction,
    });

    if (!existing) {
      return candidateCode;
    }

    counter++;
    candidateCode = `${cleanCode}-${counter}`;
  }
}

/**
 * POST /api/admin/products
 * Create a new saree product with image gallery
 */
const createProduct = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      name,
      name_en,
      nameEn,
      name_hi,
      nameHi,
      productCode,
      slug,
      description,
      description_en,
      descriptionEn,
      description_hi,
      descriptionHi,
      shortDescription,
      short_description_en,
      shortDescriptionEn,
      short_description_hi,
      shortDescriptionHi,
      categoryId,
      fabric,
      fabric_en,
      fabricEn,
      fabric_hi,
      fabricHi,
      color,
      color_en,
      colorEn,
      color_hi,
      colorHi,
      price,
      minimumOrderQuantity,
      stockQuantity,
      isAvailable,
      isFeatured,
      isNew,
      videoUrl,
      video_url,
      images,
    } = req.body;

    const finalNameHi = name_hi || nameHi || name;
    const finalNameEn = name_en || nameEn || name;
    const finalName = finalNameHi || finalNameEn;

    // 1. Validation
    if (!finalName || price === undefined) {
      throw new AppError('Product name (Hindi or English) and price are required.', 400);
    }

    // Automatically ensure unique product code and slug so same-name sarees never cause errors
    const cleanCode = await generateUniqueProductCode(
      productCode || `KS-BNS-${Math.floor(1000 + Math.random() * 9000)}`,
      null,
      transaction
    );
    const cleanSlug = await generateUniqueSlug(
      slug || finalName,
      null,
      transaction
    );

    // Validate Category ID if provided
    if (categoryId) {
      const categoryExists = await Category.findByPk(categoryId, { transaction });
      if (!categoryExists) {
        throw new AppError(`Category with ID ${categoryId} does not exist.`, 400);
      }
    }

    const incomingVideo = req.body.videoUrls !== undefined ? req.body.videoUrls : (videoUrl !== undefined ? videoUrl : video_url);
    let finalVideoUrl = null;
    if (incomingVideo) {
      if (Array.isArray(incomingVideo)) {
        finalVideoUrl = incomingVideo.length > 0 ? (incomingVideo.length === 1 ? incomingVideo[0] : JSON.stringify(incomingVideo)) : null;
      } else if (typeof incomingVideo === 'string') {
        finalVideoUrl = incomingVideo.trim() || null;
      }
    }

    // 2. Create Product record
    const product = await Product.create(
      {
        name: finalName.trim(),
        nameEn: finalNameEn ? finalNameEn.trim() : finalName.trim(),
        nameHi: finalNameHi ? finalNameHi.trim() : finalName.trim(),
        productCode: cleanCode,
        slug: cleanSlug,
        description: description ? description.trim() : (description_hi || descriptionHi || description_en || descriptionEn || null),
        descriptionEn: description_en || descriptionEn || (description ? description.trim() : null),
        descriptionHi: description_hi || descriptionHi || (description ? description.trim() : null),
        shortDescription: shortDescription ? shortDescription.trim() : (short_description_hi || shortDescriptionHi || short_description_en || shortDescriptionEn || null),
        shortDescriptionEn: short_description_en || shortDescriptionEn || (shortDescription ? shortDescription.trim() : null),
        shortDescriptionHi: short_description_hi || shortDescriptionHi || (shortDescription ? shortDescription.trim() : null),
        categoryId: categoryId || null,
        fabric: fabric ? fabric.trim() : (fabric_hi || fabricHi || fabric_en || fabricEn || null),
        fabricEn: fabric_en || fabricEn || (fabric ? fabric.trim() : null),
        fabricHi: fabric_hi || fabricHi || (fabric ? fabric.trim() : null),
        color: color ? color.trim() : (color_hi || colorHi || color_en || colorEn || null),
        colorEn: color_en || colorEn || (color ? color.trim() : null),
        colorHi: color_hi || colorHi || (color ? color.trim() : null),
        price: parseFloat(price),
        minimumOrderQuantity: minimumOrderQuantity ? parseInt(minimumOrderQuantity, 10) : 1,
        stockQuantity: stockQuantity !== undefined ? parseInt(stockQuantity, 10) : 0,
        isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
        isFeatured: Boolean(isFeatured),
        isNew: Boolean(isNew),
        videoUrl: finalVideoUrl,
      },
      { transaction }
    );

    // 3. Create Product Images if provided
    if (Array.isArray(images) && images.length > 0) {
      const imageData = images
        .filter((img) => img && img.imageUrl)
        .map((img, index) => ({
          productId: product.id,
          imageUrl: img.imageUrl.trim(),
          altText: img.altText ? img.altText.trim() : finalName.trim(),
          displayOrder: img.displayOrder !== undefined ? parseInt(img.displayOrder, 10) : index + 1,
        }));

      if (imageData.length > 0) {
        await ProductImage.bulkCreate(imageData, { transaction });
      }
    }

    await transaction.commit();

    // 4. Reload Product with Associations sorted by displayOrder
    const createdProduct = await Product.findByPk(product.id, {
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'nameEn', 'nameHi', 'slug'] },
        {
          model: ProductImage,
          as: 'images',
          attributes: ['id', 'imageUrl', 'altText', 'displayOrder'],
          separate: true,
          order: [['displayOrder', 'ASC']],
        },
      ],
    });

    return sendSuccess(res, 'Product created successfully', { product: createdProduct }, 201);
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

/**
 * GET /api/admin/products
 * Fetch all products for admin management (includes inactive/draft items)
 */
const getAdminProducts = async (req, res, next) => {
  try {
    const { search, category, isAvailable, sort } = req.query;
    const { page, limit, offset } = getPagination(req.query);
    const order = getSortOrder(sort);

    const whereClause = {};

    if (isAvailable !== undefined) {
      whereClause.isAvailable = isAvailable === 'true' || isAvailable === '1';
    }

    if (search && search.trim() !== '') {
      const searchTerm = `%${search.trim()}%`;
      whereClause[Op.or] = [
        { name: { [Op.like]: searchTerm } },
        { nameEn: { [Op.like]: searchTerm } },
        { nameHi: { [Op.like]: searchTerm } },
        { productCode: { [Op.like]: searchTerm } },
        { fabric: { [Op.like]: searchTerm } },
        { fabricEn: { [Op.like]: searchTerm } },
        { fabricHi: { [Op.like]: searchTerm } },
        { color: { [Op.like]: searchTerm } },
        { colorEn: { [Op.like]: searchTerm } },
        { colorHi: { [Op.like]: searchTerm } },
      ];
    }

    if (category) {
      whereClause.categoryId = parseInt(category, 10);
    }

    const { count, rows: products } = await Product.findAndCountAll({
      where: whereClause,
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'nameEn', 'nameHi', 'slug'] },
        {
          model: ProductImage,
          as: 'images',
          attributes: ['id', 'imageUrl', 'altText', 'displayOrder'],
          separate: true,
          order: [['displayOrder', 'ASC']],
        },
      ],
      order,
      limit,
      offset,
      distinct: true,
    });

    const pagination = getPaginationMeta(count, page, limit);

    return sendSuccess(res, 'Admin products fetched successfully', {
      products,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/products/:id
 * Fetch single product details by ID
 */
const getAdminProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id, {
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'nameEn', 'nameHi', 'slug'] },
        {
          model: ProductImage,
          as: 'images',
          attributes: ['id', 'imageUrl', 'altText', 'displayOrder'],
          separate: true,
          order: [['displayOrder', 'ASC']],
        },
      ],
    });

    if (!product) {
      throw new AppError('Product not found.', 404, { id });
    }

    return sendSuccess(res, 'Product details fetched successfully', { product });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/products/:id
 * Update product fields or images
 */
const updateProduct = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const {
      name,
      name_en,
      nameEn,
      name_hi,
      nameHi,
      productCode,
      slug,
      description,
      description_en,
      descriptionEn,
      description_hi,
      descriptionHi,
      shortDescription,
      short_description_en,
      shortDescriptionEn,
      short_description_hi,
      shortDescriptionHi,
      categoryId,
      fabric,
      fabric_en,
      fabricEn,
      fabric_hi,
      fabricHi,
      color,
      color_en,
      colorEn,
      color_hi,
      colorHi,
      price,
      minimumOrderQuantity,
      stockQuantity,
      isAvailable,
      isFeatured,
      isNew,
      videoUrl,
      video_url,
      images,
    } = req.body;

    const product = await Product.findByPk(id, { transaction });

    if (!product) {
      throw new AppError('Product not found.', 404, { id });
    }

    // Ensure unique productCode if changing
    if (productCode && productCode.trim().toUpperCase() !== product.productCode) {
      product.productCode = await generateUniqueProductCode(productCode, product.id, transaction);
    }

    // Ensure unique slug if changing
    if (slug && slug.trim().toLowerCase() !== product.slug) {
      product.slug = await generateUniqueSlug(slug, product.id, transaction);
    }

    if (name) {
      const trimmedName = name.trim();
      product.name = trimmedName;
      product.nameEn = (name_en !== undefined || nameEn !== undefined) ? ((name_en || nameEn || trimmedName).trim() || trimmedName) : trimmedName;
      product.nameHi = (name_hi !== undefined || nameHi !== undefined) ? ((name_hi || nameHi || trimmedName).trim() || trimmedName) : trimmedName;
    } else {
      if (name_en !== undefined || nameEn !== undefined) product.nameEn = (name_en || nameEn || '').trim() || null;
      if (name_hi !== undefined || nameHi !== undefined) product.nameHi = (name_hi || nameHi || '').trim() || null;
    }

    if (description !== undefined) {
      const trimmedDesc = description ? description.trim() : null;
      product.description = trimmedDesc;
      product.descriptionEn = (description_en !== undefined || descriptionEn !== undefined) ? ((description_en || descriptionEn || trimmedDesc || '').trim() || trimmedDesc) : trimmedDesc;
      product.descriptionHi = (description_hi !== undefined || descriptionHi !== undefined) ? ((description_hi || descriptionHi || trimmedDesc || '').trim() || trimmedDesc) : trimmedDesc;
    }

    if (shortDescription !== undefined) {
      const trimmedShort = shortDescription ? shortDescription.trim() : null;
      product.shortDescription = trimmedShort;
      product.shortDescriptionEn = (short_description_en !== undefined || shortDescriptionEn !== undefined) ? ((short_description_en || shortDescriptionEn || trimmedShort || '').trim() || trimmedShort) : trimmedShort;
      product.shortDescriptionHi = (short_description_hi !== undefined || shortDescriptionHi !== undefined) ? ((short_description_hi || shortDescriptionHi || trimmedShort || '').trim() || trimmedShort) : trimmedShort;
    }
    const oldCategoryId = product.categoryId;
    const newCategoryId = categoryId !== undefined ? (categoryId || null) : oldCategoryId;
    if (categoryId !== undefined) product.categoryId = newCategoryId;
    if (fabric !== undefined) product.fabric = fabric ? fabric.trim() : null;
    if (fabric_en !== undefined || fabricEn !== undefined) product.fabricEn = (fabric_en || fabricEn || '').trim() || null;
    if (fabric_hi !== undefined || fabricHi !== undefined) product.fabricHi = (fabric_hi || fabricHi || '').trim() || null;
    if (color !== undefined) product.color = color ? color.trim() : null;
    if (color_en !== undefined || colorEn !== undefined) product.colorEn = (color_en || colorEn || '').trim() || null;
    if (color_hi !== undefined || colorHi !== undefined) product.colorHi = (color_hi || colorHi || '').trim() || null;
    if (price !== undefined) product.price = parseFloat(price);
    if (minimumOrderQuantity !== undefined) product.minimumOrderQuantity = parseInt(minimumOrderQuantity, 10);
    if (stockQuantity !== undefined) product.stockQuantity = parseInt(stockQuantity, 10);
    if (isAvailable !== undefined) product.isAvailable = Boolean(isAvailable);
    if (isFeatured !== undefined) product.isFeatured = Boolean(isFeatured);
    if (isNew !== undefined) product.isNew = Boolean(isNew);

    const incomingVideo = req.body.videoUrls !== undefined ? req.body.videoUrls : (videoUrl !== undefined ? videoUrl : video_url);
    if (incomingVideo !== undefined) {
      if (Array.isArray(incomingVideo)) {
        product.videoUrl = incomingVideo.length > 0 ? (incomingVideo.length === 1 ? incomingVideo[0] : JSON.stringify(incomingVideo)) : null;
      } else if (typeof incomingVideo === 'string') {
        product.videoUrl = incomingVideo.trim() || null;
      } else {
        product.videoUrl = null;
      }
    }

    await product.save({ transaction });

    // Update Product Images if provided
    if (Array.isArray(images)) {
      await ProductImage.destroy({ where: { productId: product.id }, transaction });
      const imageData = images
        .filter((img) => img && img.imageUrl)
        .map((img, index) => ({
          productId: product.id,
          imageUrl: img.imageUrl.trim(),
          altText: img.altText ? img.altText.trim() : product.name,
          displayOrder: img.displayOrder !== undefined ? parseInt(img.displayOrder, 10) : index + 1,
        }));

      if (imageData.length > 0) {
        await ProductImage.bulkCreate(imageData, { transaction });
      }
    }

    // If category changed, ensure old category's cover image is not orphaned
    if (oldCategoryId && newCategoryId && oldCategoryId !== newCategoryId) {
      const oldCategory = await Category.findByPk(oldCategoryId, { transaction });
      if (oldCategory && oldCategory.imageUrl) {
        const otherProductInOldCat = await ProductImage.findOne({
          where: { imageUrl: oldCategory.imageUrl },
          include: [
            {
              model: Product,
              as: 'product',
              where: { categoryId: oldCategoryId, id: { [Op.ne]: product.id }, isAvailable: true },
              required: true,
            },
          ],
          transaction,
        });

        if (!otherProductInOldCat) {
          const fallbackProduct = await Product.findOne({
            where: { categoryId: oldCategoryId, id: { [Op.ne]: product.id }, isAvailable: true },
            include: [
              {
                model: ProductImage,
                as: 'images',
                attributes: ['imageUrl', 'displayOrder'],
                separate: true,
                order: [['displayOrder', 'ASC']],
              },
            ],
            order: [['id', 'DESC']],
            transaction,
          });

          oldCategory.imageUrl = fallbackProduct?.images?.[0]?.imageUrl || null;
          await oldCategory.save({ transaction });
        }
      }
    }

    await transaction.commit();

    const updatedProduct = await Product.findByPk(product.id, {
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'nameEn', 'nameHi', 'slug'] },
        {
          model: ProductImage,
          as: 'images',
          attributes: ['id', 'imageUrl', 'altText', 'displayOrder'],
          separate: true,
          order: [['displayOrder', 'ASC']],
        },
      ],
    });

    return sendSuccess(res, 'Product updated successfully', { product: updatedProduct });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

/**
 * DELETE /api/admin/products/:id
 * Soft delete product by ID (safeguards historical orders)
 */
const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id);

    if (!product) {
      throw new AppError('Product not found.', 404, { id });
    }

    // Soft-delete using Sequelize paranoid mode
    await product.destroy();

    return sendSuccess(res, 'Product soft-deleted successfully', { id: parseInt(id, 10) });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProduct,
  getAdminProducts,
  getAdminProductById,
  updateProduct,
  deleteProduct,
};
