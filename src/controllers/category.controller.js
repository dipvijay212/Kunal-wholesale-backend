const { Category, Product, sequelize } = require('../models');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * GET /api/categories
 * Fetch active saree categories with product count
 */
const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.findAll({
      where: { isActive: true },
      attributes: [
        'id',
        'name',
        'slug',
        'description',
        'createdAt',
        'updatedAt',
        [
          sequelize.fn('COUNT', sequelize.col('products.id')),
          'productCount',
        ],
      ],
      include: [
        {
          model: Product,
          as: 'products',
          attributes: [],
          where: { isAvailable: true },
          required: false,
        },
      ],
      group: ['Category.id'],
      order: [['name', 'ASC']],
    });

    return sendSuccess(res, 'Categories fetched successfully', {
      categories,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
};
