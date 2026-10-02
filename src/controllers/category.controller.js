const { Category, Product, sequelize } = require('../models');
const { sendSuccess } = require('../utils/apiResponse');
const { hasAttribute } = require('../utils/optionalColumns');

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
        'nameEn',
        'nameHi',
        'slug',
        'description',
        'descriptionEn',
        'descriptionHi',
        'imageUrl',
        ...['seoTitle', 'seoDescription'].filter((attribute) => hasAttribute(Category, attribute)),
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

    // Identify categories lacking an image
    const missingCategoryIds = categories
      .filter((cat) => !cat.imageUrl)
      .map((cat) => cat.id);

    const fallbackImagesByCat = {};
    if (missingCategoryIds.length > 0) {
      const { Op } = require('sequelize');
      const ProductImage = sequelize.models.ProductImage;
      const productsWithImages = await Product.findAll({
        where: {
          categoryId: { [Op.in]: missingCategoryIds },
          isAvailable: true,
        },
        attributes: ['id', 'categoryId'],
        include: [
          {
            model: ProductImage,
            as: 'images',
            attributes: ['imageUrl', 'displayOrder'],
            order: [['displayOrder', 'ASC']],
            separate: true,
          },
        ],
        order: [['id', 'DESC']],
      });

      for (const prod of productsWithImages) {
        if (!fallbackImagesByCat[prod.categoryId] && prod.images && prod.images.length > 0) {
          fallbackImagesByCat[prod.categoryId] = prod.images[0].imageUrl;
        }
      }
    }

    const categoriesWithImages = categories.map((cat) => {
      const catJson = cat.toJSON();
      if (!catJson.imageUrl && fallbackImagesByCat[cat.id]) {
        catJson.imageUrl = fallbackImagesByCat[cat.id];
      }
      return catJson;
    });

    return sendSuccess(res, 'Categories fetched successfully', {
      categories: categoriesWithImages,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
};
