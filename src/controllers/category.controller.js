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

    const ProductImage = sequelize.models.ProductImage;
    const categoriesWithImages = await Promise.all(
      categories.map(async (cat) => {
        const catJson = cat.toJSON();
        let isImageValidForCategory = false;

        if (catJson.imageUrl) {
          const imageBelongsToCategory = await ProductImage.findOne({
            where: { imageUrl: catJson.imageUrl },
            include: [
              {
                model: Product,
                as: 'product',
                where: { categoryId: cat.id, isAvailable: true },
                required: true,
              },
            ],
          });
          if (imageBelongsToCategory) {
            isImageValidForCategory = true;
          }
        }

        if (!isImageValidForCategory) {
          const productWithImage = await Product.findOne({
            where: { categoryId: cat.id, isAvailable: true },
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
          });

          if (
            productWithImage &&
            productWithImage.images &&
            productWithImage.images.length > 0
          ) {
            catJson.imageUrl = productWithImage.images[0].imageUrl;
            Category.update({ imageUrl: catJson.imageUrl }, { where: { id: cat.id } }).catch(() => {});
          } else {
            catJson.imageUrl = null;
            if (cat.imageUrl) {
              Category.update({ imageUrl: null }, { where: { id: cat.id } }).catch(() => {});
            }
          }
        }
        return catJson;
      })
    );

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
