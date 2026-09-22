const { DataTypes } = require('sequelize');

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
    }
  );

  return OrderItem;
};
