const { Op } = require('sequelize');
const { Product, Category, ProductImage, sequelize } = require('../models');
const { sendSuccess } = require('../utils/apiResponse');
const AppError = require('../utils/appError');
const { getPagination, getSortOrder, getPaginationMeta } = require('../utils/queryHelpers');

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
    if (!finalName || !productCode || !slug || price === undefined) {
      throw new AppError('Product name (Hindi or English), productCode, slug, and price are required.', 400);
    }

    const cleanCode = productCode.trim().toUpperCase();
    const cleanSlug = slug.trim().toLowerCase();

    // Check duplicate productCode
    const existingCode = await Product.findOne({
      where: { productCode: cleanCode },
      transaction,
    });
    if (existingCode) {
      throw new AppError(`Product code '${cleanCode}' already exists.`, 409);
    }

    // Check duplicate slug
    const existingSlug = await Product.findOne({
      where: { slug: cleanSlug },
      transaction,
    });
    if (existingSlug) {
      throw new AppError(`Product slug '${cleanSlug}' already exists.`, 409);
    }

    // Validate Category ID if provided
    if (categoryId) {
      const categoryExists = await Category.findByPk(categoryId, { transaction });
      if (!categoryExists) {
        throw new AppError(`Category with ID ${categoryId} does not exist.`, 400);
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
        isFeatured: isFeatured !== undefined ? Boolean(isFeatured) : false,
        isNew: isNew !== undefined ? Boolean(isNew) : false,
        videoUrl: videoUrl ? videoUrl.trim() : (video_url ? video_url.trim() : null),
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

    // 4. Reload Product with Associations
    const createdProduct = await Product.findByPk(product.id, {
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'nameEn', 'nameHi', 'slug'] },
        { model: ProductImage, as: 'images', attributes: ['id', 'imageUrl', 'altText', 'displayOrder'] },
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
        { model: ProductImage, as: 'images', attributes: ['id', 'imageUrl', 'altText', 'displayOrder'] },
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
        { model: ProductImage, as: 'images', attributes: ['id', 'imageUrl', 'altText', 'displayOrder'] },
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

    // Check unique productCode if changing
    if (productCode && productCode.trim().toUpperCase() !== product.productCode) {
      const cleanCode = productCode.trim().toUpperCase();
      const existingCode = await Product.findOne({ where: { productCode: cleanCode }, transaction });
      if (existingCode) {
        throw new AppError(`Product code '${cleanCode}' already exists.`, 409);
      }
      product.productCode = cleanCode;
    }

    // Check unique slug if changing
    if (slug && slug.trim().toLowerCase() !== product.slug) {
      const cleanSlug = slug.trim().toLowerCase();
      const existingSlug = await Product.findOne({ where: { slug: cleanSlug }, transaction });
      if (existingSlug) {
        throw new AppError(`Product slug '${cleanSlug}' already exists.`, 409);
      }
      product.slug = cleanSlug;
    }

    if (name) product.name = name.trim();
    if (name_en !== undefined || nameEn !== undefined) product.nameEn = (name_en || nameEn || '').trim() || null;
    if (name_hi !== undefined || nameHi !== undefined) product.nameHi = (name_hi || nameHi || '').trim() || null;
    if (description !== undefined) product.description = description ? description.trim() : null;
    if (description_en !== undefined || descriptionEn !== undefined) product.descriptionEn = (description_en || descriptionEn || '').trim() || null;
    if (description_hi !== undefined || descriptionHi !== undefined) product.descriptionHi = (description_hi || descriptionHi || '').trim() || null;
    if (shortDescription !== undefined) product.shortDescription = shortDescription ? shortDescription.trim() : null;
    if (short_description_en !== undefined || shortDescriptionEn !== undefined) product.shortDescriptionEn = (short_description_en || shortDescriptionEn || '').trim() || null;
    if (short_description_hi !== undefined || shortDescriptionHi !== undefined) product.shortDescriptionHi = (short_description_hi || shortDescriptionHi || '').trim() || null;
    if (categoryId !== undefined) product.categoryId = categoryId || null;
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
    if (videoUrl !== undefined || video_url !== undefined) {
      const v = videoUrl !== undefined ? videoUrl : video_url;
      product.videoUrl = v ? String(v).trim() : null;
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

    await transaction.commit();

    const updatedProduct = await Product.findByPk(product.id, {
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'nameEn', 'nameHi', 'slug'] },
        { model: ProductImage, as: 'images', attributes: ['id', 'imageUrl', 'altText', 'displayOrder'] },
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
