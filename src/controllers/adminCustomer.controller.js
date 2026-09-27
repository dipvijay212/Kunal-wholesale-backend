const { Op } = require('sequelize');
const { Customer, Order, OrderItem } = require('../models');
const { sendSuccess } = require('../utils/apiResponse');
const AppError = require('../utils/appError');
const { getPagination, getPaginationMeta } = require('../utils/queryHelpers');

/**
 * GET /api/admin/customers
 * Fetch all registered wholesale customers and guest order buyers directly from database
 */
const getAdminCustomers = async (req, res, next) => {
  try {
    const { search } = req.query;
    const { page, limit, offset } = getPagination(req.query);

    const isPostgres = process.env.DB_DIALECT === 'postgres' || Boolean(process.env.DATABASE_URL);
    const searchOp = isPostgres ? Op.iLike : Op.like;

    const whereClause = {};
    if (search && search.trim() !== '') {
      const term = `%${search.trim()}%`;
      whereClause[Op.or] = [
        { name: { [searchOp]: term } },
        { businessName: { [searchOp]: term } },
        { phone: { [searchOp]: term } },
        { whatsappNumber: { [searchOp]: term } },
        { email: { [searchOp]: term } },
        { city: { [searchOp]: term } },
      ];
    }

    // 1. Fetch registered customers with orders
    const { count, rows: customerRows } = await Customer.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Order,
          as: 'orders',
          attributes: ['id', 'orderNumber', 'totalItems', 'totalAmount', 'status', 'createdAt'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      distinct: true,
    });

    const customers = customerRows.map((cust) => {
      const orders = cust.orders || [];
      const totalOrders = orders.length;
      const totalSpent = orders.reduce((acc, o) => acc + Number(o.totalAmount || 0), 0);
      const totalPieces = orders.reduce((acc, o) => acc + Number(o.totalItems || 0), 0);
      const lastOrderDate = orders.length > 0
        ? orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0].createdAt
        : cust.createdAt;

      return {
        id: `cust-${cust.id}`,
        dbId: cust.id,
        name: cust.name,
        business: cust.businessName || '-',
        phone: cust.phone,
        whatsapp: cust.whatsappNumber || cust.phone,
        email: cust.email || '-',
        city: cust.city || '-',
        state: cust.state || '-',
        pincode: cust.pincode || '-',
        address: cust.address || '-',
        type: 'Wholesale Buyer',
        isActive: cust.isActive,
        totalOrders,
        totalPieces,
        totalSpent,
        lastOrderDate,
        createdAt: cust.createdAt,
      };
    });

    const pagination = getPaginationMeta(count, page, limit);

    return sendSuccess(res, 'Admin customers fetched successfully from database', {
      customers,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/customers/:id
 * Fetch single customer profile with full order history
 */
const getAdminCustomerById = async (req, res, next) => {
  try {
    const rawId = String(req.params.id).replace(/^cust-/, '');
    const customer = await Customer.findByPk(rawId, {
      include: [
        {
          model: Order,
          as: 'orders',
          include: [
            {
              model: OrderItem,
              as: 'items',
            },
          ],
        },
      ],
      order: [[{ model: Order, as: 'orders' }, 'createdAt', 'DESC']],
    });

    if (!customer) {
      throw new AppError('Customer not found.', 404);
    }

    return sendSuccess(res, 'Customer profile fetched successfully', { customer });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminCustomers,
  getAdminCustomerById,
};
