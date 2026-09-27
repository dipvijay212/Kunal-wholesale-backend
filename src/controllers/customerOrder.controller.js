const { Order, OrderItem, Product, ProductImage } = require('../models');
const { sendSuccess } = require('../utils/apiResponse');
const AppError = require('../utils/appError');

/**
 * GET /api/customer/orders
 * Returns paginated orders belonging to the authenticated customer
 */
const getCustomerOrders = async (req, res, next) => {
  try {
    const customerId = req.customer.id;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const offset = (page - 1) * limit;

    const { count, rows: orders } = await Order.findAndCountAll({
      where: { customerId },
      include: [
        {
          model: OrderItem,
          as: 'items',
          attributes: [
            'id',
            'productId',
            'productName',
            'productNameHi',
            'productNameEn',
            'productCode',
            'unitPrice',
            'quantity',
            'subtotal',
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      distinct: true,
    });

    const totalPages = Math.ceil(count / limit);

    return sendSuccess(
      res,
      'Customer orders retrieved successfully',
      {
        orders,
        pagination: {
          totalItems: count,
          totalPages,
          currentPage: page,
          limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/customer/orders/:id
 * Returns single order detail, strictly verifying customer ownership
 */
const getCustomerOrderById = async (req, res, next) => {
  try {
    const customerId = req.customer.id;
    const { id } = req.params;

    // Check if id is numeric ID or orderNumber string
    const whereCondition = isNaN(Number(id))
      ? { orderNumber: id, customerId }
      : { id: Number(id), customerId };

    const order = await Order.findOne({
      where: whereCondition,
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'nameHi', 'nameEn', 'slug', 'productCode', 'price', 'fabric', 'fabricHi', 'fabricEn'],
              include: [
                {
                  model: ProductImage,
                  as: 'images',
                  attributes: ['id', 'imageUrl', 'altText', 'displayOrder'],
                },
              ],
            },
          ],
        },
      ],
    });

    if (!order) {
      throw new AppError('Order not found or you do not have permission to view it.', 404);
    }

    return sendSuccess(
      res,
      'Order details retrieved successfully',
      {
        order,
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCustomerOrders,
  getCustomerOrderById,
};
