const { Op } = require('sequelize');
const { Product, Category, Collection, ProductImage } = require('../models');
const { sendSuccess } = require('../utils/apiResponse');
const AppError = require('../utils/appError');
const { getPagination, getSortOrder, getPaginationMeta } = require('../utils/queryHelpers');

/**
 * GET /api/products
 * Fetch paginated, searchable, filterable, and sorted product catalog
 */
const getProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      collection,
      fabric,
      color,
      minPrice,
      maxPrice,
      isAvailable,
      sort,
    } = req.query;

    const { page, limit, offset } = getPagination(req.query);
    const order = getSortOrder(sort);

    // Build Product WHERE clause
    const whereClause = {};

    // Availability Filter (if explicitly passed)
    if (isAvailable !== undefined) {
      whereClause.isAvailable = isAvailable === 'true' || isAvailable === '1';
    }

    // Search term matching name, productCode, fabric, color
    if (search && search.trim() !== '') {
      const searchTerm = `%${search.trim()}%`;
      whereClause[Op.or] = [
        { name: { [Op.like]: searchTerm } },
        { productCode: { [Op.like]: searchTerm } },
        { fabric: { [Op.like]: searchTerm } },
        { color: { [Op.like]: searchTerm } },
      ];
    }

    // Fabric Filter
    if (fabric) {
      whereClause.fabric = { [Op.like]: `%${fabric.trim()}%` };
    }

    // Color Filter
    if (color) {
      whereClause.color = { [Op.like]: `%${color.trim()}%` };
    }

    // Price Range Filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      whereClause.price = {};
      if (minPrice !== undefined && !isNaN(parseFloat(minPrice))) {
        whereClause.price[Op.gte] = parseFloat(minPrice);
      }
      if (maxPrice !== undefined && !isNaN(parseFloat(maxPrice))) {
        whereClause.price[Op.lte] = parseFloat(maxPrice);
      }
    }

    // Include relationships
    const includeClause = [
      {
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'slug'],
        required: false,
      },
      {
        model: ProductImage,
        as: 'images',
        attributes: ['id', 'imageUrl', 'altText', 'displayOrder'],
        separate: true,
        order: [['displayOrder', 'ASC']],
      },
      {
        model: Collection,
        as: 'collections',
        attributes: ['id', 'name', 'slug'],
        through: { attributes: [] },
        required: false,
      },
    ];

    // Category Filter (by ID or Slug)
    if (category) {
      const categoryWhere = isNaN(category)
        ? { slug: category.trim() }
        : { id: parseInt(category, 10) };

      includeClause[0].where = categoryWhere;
      includeClause[0].required = true;
    }

    // Collection Filter (by ID or Slug)
    if (collection) {
      const collectionWhere = isNaN(collection)
        ? { slug: collection.trim() }
        : { id: parseInt(collection, 10) };

      includeClause[2].where = collectionWhere;
      includeClause[2].required = true;
    }

    // Query Products with findAndCountAll
    const { count, rows: products } = await Product.findAndCountAll({
      where: whereClause,
      include: includeClause,
      order,
      limit,
      offset,
      distinct: true, // Prevents duplicate counts due to includes
    });

    const pagination = getPaginationMeta(count, page, limit);

    return sendSuccess(res, 'Products fetched successfully', {
      products,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/products/:slug
 * Fetch single product detail by slug
 */
const getProductBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const product = await Product.findOne({
      where: { slug: slug.trim() },
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug', 'description'],
        },
        {
          model: ProductImage,
          as: 'images',
          attributes: ['id', 'imageUrl', 'altText', 'displayOrder'],
          order: [['displayOrder', 'ASC']],
        },
        {
          model: Collection,
          as: 'collections',
          attributes: ['id', 'name', 'slug', 'description', 'image'],
          through: { attributes: [] },
        },
      ],
    });

    if (!product) {
      throw new AppError('Product not found', 404, { slug });
    }

    return sendSuccess(res, 'Product details fetched successfully', {
      product,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductBySlug,
};
