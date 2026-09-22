const { Product, Order, OrderItem, sequelize } = require('../models');
const { sendSuccess } = require('../utils/apiResponse');
const AppError = require('../utils/appError');
const { generateOrderNumber } = require('../utils/orderNumber');

/**
 * POST /api/orders
 * Public customer order placement endpoint
 */
const createOrder = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      customerName,
      businessName,
      phone,
      whatsappNumber,
      email,
      address,
      city,
      state,
      pincode,
      notes,
      items,
    } = req.body;

    // 1. Validate customer information
    if (!customerName || !phone || !address || !city || !state || !pincode) {
      throw new AppError(
        'Please provide customerName, phone, address, city, state, and pincode.',
        400
      );
    }

    // 2. Validate items array
    if (!Array.isArray(items) || items.length === 0) {
      throw new AppError('Order must contain at least one item.', 400);
    }

    // 3. Extract & validate unique product IDs
    const productIds = [...new Set(items.map((item) => item.productId).filter(Boolean))];

    if (productIds.length !== items.length) {
      throw new AppError('Invalid or duplicate product IDs in order items.', 400);
    }

    // 4. Fetch products from MySQL database
    const products = await Product.findAll({
      where: { id: productIds },
      transaction,
    });

    const productMap = new Map();
    products.forEach((p) => productMap.set(p.id, p));

    // 5. Validate every requested product
    let totalItems = 0;
    let subtotal = 0;
    const orderItemsData = [];

    for (const item of items) {
      const { productId, quantity } = item;
      const parsedQty = parseInt(quantity, 10);

      if (isNaN(parsedQty) || parsedQty <= 0) {
        throw new AppError(`Invalid quantity for product ID ${productId}.`, 400);
      }

      const product = productMap.get(productId);

      // Check product existence
      if (!product) {
        throw new AppError(`Product with ID ${productId} was not found.`, 400);
      }

      // Check product availability
      if (!product.isAvailable) {
        throw new AppError(
          `Product '${product.name}' (Code: ${product.productCode}) is currently unavailable for order.`,
          400
        );
      }

      // Check Minimum Order Quantity (MOQ)
      const moq = product.minimumOrderQuantity || 1;
      if (parsedQty < moq) {
        throw new AppError(
          `Minimum order quantity for '${product.name}' is ${moq}. You requested ${parsedQty}.`,
          400,
          { productId, productCode: product.productCode, minimumOrderQuantity: moq, requestedQuantity: parsedQty }
        );
      }

      // Calculate unit price and subtotal from MySQL DB (NEVER trust frontend prices)
      const unitPrice = parseFloat(product.price);
      const lineSubtotal = parseFloat((unitPrice * parsedQty).toFixed(2));

      totalItems += parsedQty;
      subtotal += lineSubtotal;

      // Prepare historical snapshot data for OrderItem
      orderItemsData.push({
        productId: product.id,
        productName: product.name,
        productCode: product.productCode,
        unitPrice,
        quantity: parsedQty,
        subtotal: lineSubtotal,
      });
    }

    subtotal = parseFloat(subtotal.toFixed(2));
    const totalAmount = subtotal; // No shipping/tax additions specified

    // 6. Generate unique order number (e.g. KS-20260922-0001)
    const orderNumber = await generateOrderNumber(transaction);

    // 7. Create Order in database
    const order = await Order.create(
      {
        orderNumber,
        customerName: customerName.trim(),
        businessName: businessName ? businessName.trim() : null,
        phone: phone.trim(),
        whatsappNumber: whatsappNumber ? whatsappNumber.trim() : phone.trim(),
        email: email ? email.trim().toLowerCase() : null,
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        notes: notes ? notes.trim() : null,
        totalItems,
        subtotal,
        totalAmount,
        status: 'pending',
      },
      { transaction }
    );

    // 8. Create OrderItem historical snapshot records
    const orderItemsWithOrderId = orderItemsData.map((item) => ({
      ...item,
      orderId: order.id,
    }));

    await OrderItem.bulkCreate(orderItemsWithOrderId, { transaction });

    // 9. Commit transaction
    await transaction.commit();

    // 10. Return customer response
    return sendSuccess(
      res,
      'Order placed successfully',
      {
        orderNumber: order.orderNumber,
        status: order.status,
        totalItems: order.totalItems,
        subtotal: order.subtotal,
        totalAmount: order.totalAmount,
      },
      201
    );
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

module.exports = {
  createOrder,
};
