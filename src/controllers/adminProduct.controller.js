const { Op } = require('sequelize');
const { Product, Category, Collection, ProductImage, ProductCollection, sequelize } = require('../models');
const { sendSuccess } = require('../utils/apiResponse');
const AppError = require('../utils/appError');
const { getPagination, getSortOrder, getPaginationMeta } = require('../utils/queryHelpers');

/**
 * POST /api/admin/products
 * Create a new saree product with image gallery & collections
 */
const createProduct = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      name,
      productCode,
      slug,
      description,
      shortDescription,
      categoryId,
      fabric,
      color,
      price,
      minimumOrderQuantity,
      stockQuantity,
      isAvailable,
      isFeatured,
      isNew,
      images,
      collectionIds,
    } = req.body;

    // 1. Validation
    if (!name || !productCode || !slug || price === undefined) {
      throw new AppError('Product name, productCode, slug, and price are required.', 400);
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
        name: name.trim(),
        productCode: cleanCode,
        slug: cleanSlug,
        description: description ? description.trim() : null,
        shortDescription: shortDescription ? shortDescription.trim() : null,
        categoryId: categoryId || null,
        fabric: fabric ? fabric.trim() : null,
        color: color ? color.trim() : null,
        price: parseFloat(price),
        minimumOrderQuantity: minimumOrderQuantity ? parseInt(minimumOrderQuantity, 10) : 1,
        stockQuantity: stockQuantity !== undefined ? parseInt(stockQuantity, 10) : 0,
        isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
        isFeatured: isFeatured !== undefined ? Boolean(isFeatured) : false,
        isNew: isNew !== undefined ? Boolean(isNew) : false,
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
          altText: img.altText ? img.altText.trim() : name.trim(),
          displayOrder: img.displayOrder !== undefined ? parseInt(img.displayOrder, 10) : index + 1,
        }));

      if (imageData.length > 0) {
        await ProductImage.bulkCreate(imageData, { transaction });
      }
    }

    // 4. Map Collections if provided
    if (Array.isArray(collectionIds) && collectionIds.length > 0) {
      const validCollections = await Collection.findAll({
        where: { id: { [Op.in]: collectionIds } },
        transaction,
      });
      await product.setCollections(validCollections, { transaction });
    }

    await transaction.commit();

    // 5. Reload Product with Associations
    const createdProduct = await Product.findByPk(product.id, {
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
        { model: ProductImage, as: 'images', attributes: ['id', 'imageUrl', 'altText', 'displayOrder'] },
        { model: Collection, as: 'collections', attributes: ['id', 'name', 'slug'], through: { attributes: [] } },
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
        { productCode: { [Op.like]: searchTerm } },
        { fabric: { [Op.like]: searchTerm } },
        { color: { [Op.like]: searchTerm } },
      ];
    }

    if (category) {
      whereClause.categoryId = parseInt(category, 10);
    }

    const { count, rows: products } = await Product.findAndCountAll({
      where: whereClause,
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
        { model: ProductImage, as: 'images', attributes: ['id', 'imageUrl', 'altText', 'displayOrder'] },
        { model: Collection, as: 'collections', attributes: ['id', 'name', 'slug'], through: { attributes: [] } },
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
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
        { model: ProductImage, as: 'images', attributes: ['id', 'imageUrl', 'altText', 'displayOrder'] },
        { model: Collection, as: 'collections', attributes: ['id', 'name', 'slug'], through: { attributes: [] } },
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
 * Update product fields, images, or collection associations
 */
const updateProduct = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const {
      name,
      productCode,
      slug,
      description,
      shortDescription,
      categoryId,
      fabric,
      color,
      price,
      minimumOrderQuantity,
      stockQuantity,
      isAvailable,
      isFeatured,
      isNew,
      images,
      collectionIds,
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
    if (description !== undefined) product.description = description ? description.trim() : null;
    if (shortDescription !== undefined) product.shortDescription = shortDescription ? shortDescription.trim() : null;
    if (categoryId !== undefined) product.categoryId = categoryId || null;
    if (fabric !== undefined) product.fabric = fabric ? fabric.trim() : null;
    if (color !== undefined) product.color = color ? color.trim() : null;
    if (price !== undefined) product.price = parseFloat(price);
    if (minimumOrderQuantity !== undefined) product.minimumOrderQuantity = parseInt(minimumOrderQuantity, 10);
    if (stockQuantity !== undefined) product.stockQuantity = parseInt(stockQuantity, 10);
    if (isAvailable !== undefined) product.isAvailable = Boolean(isAvailable);
    if (isFeatured !== undefined) product.isFeatured = Boolean(isFeatured);
    if (isNew !== undefined) product.isNew = Boolean(isNew);

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

    // Update Collections if provided
    if (Array.isArray(collectionIds)) {
      const validCollections = await Collection.findAll({
        where: { id: { [Op.in]: collectionIds } },
        transaction,
      });
      await product.setCollections(validCollections, { transaction });
    }

    await transaction.commit();

    const updatedProduct = await Product.findByPk(product.id, {
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
        { model: ProductImage, as: 'images', attributes: ['id', 'imageUrl', 'altText', 'displayOrder'] },
        { model: Collection, as: 'collections', attributes: ['id', 'name', 'slug'], through: { attributes: [] } },
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
