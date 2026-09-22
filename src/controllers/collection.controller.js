const { Collection, Product, Category, ProductImage } = require('../models');
const { sendSuccess } = require('../utils/apiResponse');
const AppError = require('../utils/appError');
const { getPagination, getSortOrder, getPaginationMeta } = require('../utils/queryHelpers');

/**
 * GET /api/collections
 * Fetch active collections list
 */
const getCollections = async (req, res, next) => {
  try {
    const collections = await Collection.findAll({
      where: { isActive: true },
      order: [['name', 'ASC']],
    });

    return sendSuccess(res, 'Collections fetched successfully', {
      collections,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/collections/:slug
 * Fetch single collection detail and its associated paginated products
 */
const getCollectionBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { sort } = req.query;
    const { page, limit, offset } = getPagination(req.query);
    const order = getSortOrder(sort);

    // 1. Fetch collection metadata
    const collection = await Collection.findOne({
      where: {
        slug: slug.trim(),
        isActive: true,
      },
    });

    if (!collection) {
      throw new AppError('Collection not found', 404, { slug });
    }

    // 2. Fetch products for this collection with pagination
    const { count, rows: products } = await Product.findAndCountAll({
      where: { isAvailable: true },
      include: [
        {
          model: Collection,
          as: 'collections',
          where: { id: collection.id },
          attributes: [],
          through: { attributes: [] },
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug'],
        },
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

    return sendSuccess(res, 'Collection details and products fetched successfully', {
      collection,
      products,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCollections,
  getCollectionBySlug,
};
