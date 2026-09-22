const { Op } = require('sequelize');
const { Order } = require('../models');

/**
 * Generate a unique human-readable order number (e.g. KS-20260922-0001)
 * @param {Object} [transaction] - Optional Sequelize Transaction
 * @returns {Promise<string>} Generated Order Number
 */
const generateOrderNumber = async (transaction = null) => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const datePrefix = `KS-${year}${month}${day}`;

  // Find latest order for today matching datePrefix
  const latestOrder = await Order.findOne({
    where: {
      orderNumber: {
        [Op.like]: `${datePrefix}-%`,
      },
    },
    order: [['id', 'DESC']],
    attributes: ['orderNumber'],
    transaction,
  });

  let nextSequence = 1;
  if (latestOrder && latestOrder.orderNumber) {
    const parts = latestOrder.orderNumber.split('-');
    const lastSequenceStr = parts[parts.length - 1];
    const lastSequence = parseInt(lastSequenceStr, 10);
    if (!isNaN(lastSequence)) {
      nextSequence = lastSequence + 1;
    }
  }

  const paddedSequence = String(nextSequence).padStart(4, '0');
  return `${datePrefix}-${paddedSequence}`;
};

module.exports = {
  generateOrderNumber,
};
