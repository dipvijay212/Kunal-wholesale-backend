const { DataTypes } = require('sequelize');
const { englishOnlyHooks } = require('../utils/englishOnly');

module.exports = (sequelize) => {
  const OrderItem = sequelize.define(
    'OrderItem',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      orderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'order_id',
        references: {
          model: 'orders',
          key: 'id',
        },
      },
      productId: {
        type: DataTypes.INTEGER,
        allowNull: true, // Nullable to maintain historical orders if product is hard deleted
        field: 'product_id',
        references: {
          model: 'products',
          key: 'id',
        },
      },
      productName: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'product_name',
        comment: 'Historical snapshot of product name at order placement',
      },
      productNameEn: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'product_name_en',
        comment: 'Historical snapshot of product English name at order placement',
      },
      productNameHi: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'product_name_hi',
        comment: 'Historical snapshot of product Hindi name at order placement',
      },
      productCode: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'product_code',
        comment: 'Historical snapshot of product code at order placement',
      },
      unitPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: 'unit_price',
        comment: 'Historical snapshot of unit price at order placement',
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: { args: [1], msg: 'Quantity must be at least 1' },
        },
      },
      subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Historical snapshot of subtotal for item line',
      },
    },
    {
      tableName: 'order_items',
      timestamps: true,
      underscored: true,
      // Order snapshots keep the English product name only (orders are never rejected).
      hooks: englishOnlyHooks({ hindiFields: ['productNameHi'] }),
    }
  );

  return OrderItem;
};
