const { Op } = require('sequelize');
const { Order, OrderItem, Product } = require('../models');
const { sendSuccess } = require('../utils/apiResponse');
const AppError = require('../utils/appError');
const { getPagination, getPaginationMeta } = require('../utils/queryHelpers');

const ALLOWED_ORDER_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'packed',
  'shipped',
  'completed',
  'cancelled',
];

/**
 * GET /api/admin/orders
 * Admin list orders with pagination, search, status filter & date range
 */
const getAdminOrders = async (req, res, next) => {
  try {
    const { status, search, dateFrom, dateTo } = req.query;
    const { page, limit, offset } = getPagination(req.query);

    const whereClause = {};

    // Status Filter
    if (status) {
      if (!ALLOWED_ORDER_STATUSES.includes(status)) {
        throw new AppError(`Invalid status '${status}'. Allowed statuses: ${ALLOWED_ORDER_STATUSES.join(', ')}`, 400);
      }
      whereClause.status = status;
    }

    // Search Filter
    if (search && search.trim() !== '') {
      const searchTerm = `%${search.trim()}%`;
      whereClause[Op.or] = [
        { orderNumber: { [Op.like]: searchTerm } },
        { customerName: { [Op.like]: searchTerm } },
        { businessName: { [Op.like]: searchTerm } },
        { phone: { [Op.like]: searchTerm } },
        { whatsappNumber: { [Op.like]: searchTerm } },
      ];
    }

    // Date Range Filter
    if (dateFrom || dateTo) {
      whereClause.createdAt = {};
      if (dateFrom) {
        whereClause.createdAt[Op.gte] = new Date(dateFrom);
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        whereClause.createdAt[Op.lte] = endDate;
      }
    }

    const { count, rows: orders } = await Order.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: OrderItem,
          as: 'items',
          attributes: ['id', 'productId', 'productName', 'productCode', 'unitPrice', 'quantity', 'subtotal'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      distinct: true,
    });

    const pagination = getPaginationMeta(count, page, limit);

    return sendSuccess(res, 'Admin orders fetched successfully', {
      orders,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/orders/:id
 * Admin view single order details with item snapshots
 */
const getAdminOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await Order.findByPk(id, {
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'slug', 'productCode', 'fabric', 'color', 'isAvailable'],
              paranoid: false, // Include soft-deleted products for historical audit
            },
          ],
        },
      ],
    });

    if (!order) {
      throw new AppError('Order not found.', 404, { id });
    }

    return sendSuccess(res, 'Order details fetched successfully', { order });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/orders/:id/status
 * Admin update order status
 */
const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      throw new AppError('Please provide a new order status.', 400);
    }

    const cleanStatus = status.trim().toLowerCase();

    if (!ALLOWED_ORDER_STATUSES.includes(cleanStatus)) {
      throw new AppError(
        `Invalid status '${status}'. Allowed statuses: ${ALLOWED_ORDER_STATUSES.join(', ')}`,
        400
      );
    }

    const order = await Order.findByPk(id);

    if (!order) {
      throw new AppError('Order not found.', 404, { id });
    }

    order.status = cleanStatus;
    await order.save();

    return sendSuccess(res, `Order status updated to '${cleanStatus}' successfully`, {
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        updatedAt: order.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminOrders,
  getAdminOrderById,
  updateOrderStatus,
};
