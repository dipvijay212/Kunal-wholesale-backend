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

    // One query for every image of every available product in these categories, instead of
    // one or two queries per category. Cover-image rules are unchanged:
    //  - a category image is kept only if it is a photo of one of its available products;
    //  - otherwise the newest product's first photo is used (or none).
    const ProductImage = sequelize.models.ProductImage;
    const categoryIds = categories.map((cat) => cat.id);
    const images = categoryIds.length
      ? await ProductImage.findAll({
          attributes: ['imageUrl', 'displayOrder', 'productId'],
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'categoryId'],
              where: { categoryId: categoryIds, isAvailable: true },
              required: true,
            },
          ],
        })
      : [];

    const urlsByCategory = new Map();
    const coverByCategory = new Map(); // newest product, then lowest display order
    for (const image of images) {
      const categoryId = image.product.categoryId;
      if (!urlsByCategory.has(categoryId)) urlsByCategory.set(categoryId, new Set());
      urlsByCategory.get(categoryId).add(image.imageUrl);

      const current = coverByCategory.get(categoryId);
      const order = image.displayOrder ?? 0;
      if (
        !current ||
        image.productId > current.productId ||
        (image.productId === current.productId && order < current.order)
      ) {
        coverByCategory.set(categoryId, { productId: image.productId, order, url: image.imageUrl });
      }
    }

    const categoriesWithImages = categories.map((cat) => {
      const catJson = cat.toJSON();
      const belongsToCategory = Boolean(catJson.imageUrl && urlsByCategory.get(cat.id)?.has(catJson.imageUrl));
      if (!belongsToCategory) {
        const nextUrl = coverByCategory.get(cat.id)?.url ?? null;
        if (nextUrl !== (cat.imageUrl ?? null)) {
          // Keep the stored cover in sync in the background; never delays the response.
          Category.update({ imageUrl: nextUrl }, { where: { id: cat.id } }).catch(() => {});
        }
        catJson.imageUrl = nextUrl;
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
