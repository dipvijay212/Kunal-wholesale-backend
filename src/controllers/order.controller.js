const { Product, Order, OrderItem, Customer, sequelize } = require('../models');
const { generateCustomerToken } = require('../utils/jwt');
const { sendSuccess } = require('../utils/apiResponse');
const AppError = require('../utils/appError');
const { generateOrderNumber } = require('../utils/orderNumber');

function normalizePhone(rawPhone) {
  if (!rawPhone) return '';
  const digits = String(rawPhone).replace(/\D/g, '').replace(/^0+/, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  return digits;
}

/**
 * POST /api/orders
 * Unified customer order placement endpoint
 * Supports:
 *   1. Authenticated customer checkout (via req.customer)
 *   2. First-time customer checkout + account creation in an atomic transaction
 *   3. Prevents duplicate accounts when an unauthenticated customer enters an existing phone number
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
      password,
      confirmPassword,
      address,
      city,
      state,
      pincode,
      notes,
      items,
    } = req.body;

    const loggedInCustomer = req.customer;

    // 1. Validate customer information
    if (!customerName || !phone || !address) {
      throw new AppError(
        'Please provide customer name, mobile number, and delivery address.',
        400
      );
    }

    const cleanPhone = normalizePhone(phone);
    if (!cleanPhone || cleanPhone.length !== 10) {
      throw new AppError('Please enter a valid 10-digit mobile number.', 400);
    }

    const cleanWhatsapp = whatsappNumber ? normalizePhone(whatsappNumber) : cleanPhone;

    let customerId = loggedInCustomer ? loggedInCustomer.id : null;
    let newCustomer = null;
    let authToken = null;

    // 2. Handle first-time customer registration if not logged in
    if (!loggedInCustomer) {
      // Check if phone number already belongs to an existing customer
      const existingCustomer = await Customer.findOne({
        where: { phone: cleanPhone },
        transaction,
      });

      if (existingCustomer) {
        throw new AppError(
          'An account with this mobile number already exists. Please log in.',
          409,
          {
            code: 'CUSTOMER_EXISTS',
            phone: cleanPhone,
          }
        );
      }

      // Validate password for new account
      if (!password || typeof password !== 'string' || password.length < 8) {
        throw new AppError('Password must be at least 8 characters long.', 400);
      }

      if (confirmPassword !== undefined && password !== confirmPassword) {
        throw new AppError('Password confirmation does not match.', 400);
      }

      // Create new Customer inside the transaction
      newCustomer = await Customer.create(
        {
          name: customerName.trim(),
          businessName: businessName ? businessName.trim() : null,
          phone: cleanPhone,
          whatsappNumber: cleanWhatsapp,
          email: email ? email.trim().toLowerCase() : null,
          password, // Hashed automatically by Customer model beforeCreate hook
          address: address.trim(),
          city: city ? city.trim() : '',
          state: state ? state.trim() : '',
          pincode: pincode ? pincode.trim() : '',
          isActive: true,
        },
        { transaction }
      );

      customerId = newCustomer.id;
      authToken = generateCustomerToken({ customerId: newCustomer.id });
    } else {
      // If customer is already logged in, update their profile with any updated address info if blank
      if (!loggedInCustomer.businessName && businessName) {
        loggedInCustomer.businessName = businessName.trim();
        await loggedInCustomer.save({ transaction });
      }
    }

    // 3. Validate items array
    if (!Array.isArray(items) || items.length === 0) {
      throw new AppError('Order must contain at least one item.', 400);
    }

    // 4. Extract & validate unique product IDs
    const productIds = [...new Set(items.map((item) => item.productId).filter(Boolean))];

    if (productIds.length !== items.length) {
      throw new AppError('Invalid or duplicate product IDs in order items.', 400);
    }

    // 5. Fetch products from MySQL database
    const products = await Product.findAll({
      where: { id: productIds },
      transaction,
    });

    const productMap = new Map();
    products.forEach((p) => productMap.set(p.id, p));

    // 6. Validate every requested product
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

      // Sarees are sold in full sets only: quantity must be a whole multiple of the set size (MOQ)
      if (parsedQty % moq !== 0) {
        throw new AppError(
          `'${product.name}' is sold in sets of ${moq}. Please order ${moq}, ${moq * 2}, ${moq * 3}... pieces. You requested ${parsedQty}.`,
          400,
          { productId, productCode: product.productCode, minimumOrderQuantity: moq, requestedQuantity: parsedQty }
        );
      }

      // Calculate unit price and subtotal from MySQL DB (NEVER trust frontend prices)
      const unitPrice = parseFloat(product.price);
      const lineSubtotal = parseFloat((unitPrice * parsedQty).toFixed(2));

      totalItems += parsedQty;
      subtotal += lineSubtotal;

      // Prepare historical snapshot data for OrderItem with Hindi & English names
      const productNameHi = product.nameHi || product.name;
      const productNameEn = product.nameEn || product.name;

      orderItemsData.push({
        productId: product.id,
        productName: productNameHi || product.name,
        productNameHi,
        productNameEn,
        productCode: product.productCode,
        unitPrice,
        quantity: parsedQty,
        subtotal: lineSubtotal,
      });
    }

    subtotal = parseFloat(subtotal.toFixed(2));
    const totalAmount = subtotal;

    // 7. Generate unique order number (e.g. KS-20260925-0001)
    const orderNumber = await generateOrderNumber(transaction);

    // 8. Create Order in database with full customer snapshots
    const order = await Order.create(
      {
        orderNumber,
        customerId,
        customerName: customerName.trim(),
        businessName: businessName ? businessName.trim() : null,
        phone: cleanPhone,
        whatsappNumber: cleanWhatsapp,
        email: email ? email.trim().toLowerCase() : null,
        address: address.trim(),
        city: city ? city.trim() : '',
        state: state ? state.trim() : '',
        pincode: pincode ? pincode.trim() : '',
        notes: notes ? notes.trim() : null,
        totalItems,
        subtotal,
        totalAmount,
        status: 'confirmed',
      },
      { transaction }
    );

    // 9. Create OrderItem historical snapshot records
    const orderItemsWithOrderId = orderItemsData.map((item) => ({
      ...item,
      orderId: order.id,
    }));

    await OrderItem.bulkCreate(orderItemsWithOrderId, { transaction });

    // 10. Commit atomic transaction
    await transaction.commit();

    // 11. Return customer response with optional session token if newly registered
    const responsePayload = {
      orderNumber: order.orderNumber,
      status: order.status,
      totalItems: order.totalItems,
      subtotal: order.subtotal,
      totalAmount: order.totalAmount,
    };

    if (newCustomer && authToken) {
      responsePayload.customer = newCustomer.toJSON();
      responsePayload.token = authToken;
    }

    return sendSuccess(
      res,
      'Order placed successfully',
      responsePayload,
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
