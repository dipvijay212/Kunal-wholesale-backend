const { Op } = require('sequelize');
const { Product, Category, ProductImage } = require('../models');
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

    // Search term matching name (en/hi), description (en/hi), productCode, fabric (en/hi), color (en/hi)
    if (search && search.trim() !== '') {
      const searchTerm = `%${search.trim()}%`;
      whereClause[Op.or] = [
        { name: { [Op.like]: searchTerm } },
        { nameEn: { [Op.like]: searchTerm } },
        { nameHi: { [Op.like]: searchTerm } },
        { productCode: { [Op.like]: searchTerm } },
        { description: { [Op.like]: searchTerm } },
        { descriptionEn: { [Op.like]: searchTerm } },
        { descriptionHi: { [Op.like]: searchTerm } },
        { shortDescription: { [Op.like]: searchTerm } },
        { shortDescriptionEn: { [Op.like]: searchTerm } },
        { shortDescriptionHi: { [Op.like]: searchTerm } },
        { fabric: { [Op.like]: searchTerm } },
        { fabricEn: { [Op.like]: searchTerm } },
        { fabricHi: { [Op.like]: searchTerm } },
        { color: { [Op.like]: searchTerm } },
        { colorEn: { [Op.like]: searchTerm } },
        { colorHi: { [Op.like]: searchTerm } },
      ];
    }

    // Fabric Filter (supports either technical, english or hindi)
    if (fabric) {
      const fabricTerm = `%${fabric.trim()}%`;
      whereClause[Op.and] = whereClause[Op.and] || [];
      whereClause[Op.and].push({
        [Op.or]: [
          { fabric: { [Op.like]: fabricTerm } },
          { fabricEn: { [Op.like]: fabricTerm } },
          { fabricHi: { [Op.like]: fabricTerm } },
        ],
      });
    }

    // Color Filter (supports either technical, english or hindi)
    if (color) {
      const colorTerm = `%${color.trim()}%`;
      whereClause[Op.and] = whereClause[Op.and] || [];
      whereClause[Op.and].push({
        [Op.or]: [
          { color: { [Op.like]: colorTerm } },
          { colorEn: { [Op.like]: colorTerm } },
          { colorHi: { [Op.like]: colorTerm } },
        ],
      });
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
        attributes: ['id', 'name', 'nameEn', 'nameHi', 'slug', 'description', 'descriptionEn', 'descriptionHi'],
        required: false,
      },
      {
        model: ProductImage,
        as: 'images',
        attributes: ['id', 'imageUrl', 'altText', 'displayOrder'],
        separate: true,
        order: [['displayOrder', 'ASC']],
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

    // Query Products with findAndCountAll
    const { count, rows: products } = await Product.findAndCountAll({
      where: whereClause,
      include: includeClause,
      order,
      limit,
      offset,
      distinct: true,
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
          attributes: ['id', 'name', 'nameEn', 'nameHi', 'slug', 'description', 'descriptionEn', 'descriptionHi'],
        },
        {
          model: ProductImage,
          as: 'images',
          attributes: ['id', 'imageUrl', 'altText', 'displayOrder'],
          order: [['displayOrder', 'ASC']],
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
