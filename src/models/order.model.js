const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Order = sequelize.define(
    'Order',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      orderNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: {
          msg: 'Order number must be unique',
        },
        field: 'order_number',
      },
      customerName: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'customer_name',
        validate: {
          notEmpty: { msg: 'Customer name is required' },
        },
      },
      businessName: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'business_name',
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Phone number is required' },
        },
      },
      whatsappNumber: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'whatsapp_number',
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isEmail: { msg: 'Please enter a valid email address' },
        },
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Shipping address is required' },
        },
      },
      city: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'City is required' },
        },
      },
      state: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'State is required' },
        },
      },
      pincode: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Pincode is required' },
        },
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      totalItems: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'total_items',
        validate: {
          min: { args: [0], msg: 'Total items cannot be negative' },
        },
      },
      subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
        validate: {
          isDecimal: true,
          min: 0,
        },
      },
      totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
        field: 'total_amount',
        validate: {
          isDecimal: true,
          min: 0,
        },
      },
      status: {
        type: DataTypes.ENUM(
          'pending',
          'confirmed',
          'processing',
          'packed',
          'shipped',
          'completed',
          'cancelled'
        ),
        defaultValue: 'pending',
        allowNull: false,
      },
    },
    {
      tableName: 'orders',
      timestamps: true,
      underscored: true,
    }
  );

  return Order;
};
