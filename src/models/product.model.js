const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Product = sequelize.define(
    'Product',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Product name is required' },
        },
      },
      slug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: {
          msg: 'Product slug must be unique',
        },
        validate: {
          notEmpty: { msg: 'Product slug is required' },
        },
      },
      productCode: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: {
          msg: 'Product code must be unique',
        },
        field: 'product_code',
        validate: {
          notEmpty: { msg: 'Product code is required' },
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      shortDescription: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'short_description',
      },
      categoryId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'category_id',
        references: {
          model: 'categories',
          key: 'id',
        },
      },
      fabric: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      color: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          isDecimal: { msg: 'Price must be a valid decimal number' },
          min: { args: [0], msg: 'Price cannot be negative' },
        },
      },
      minimumOrderQuantity: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        field: 'minimum_order_quantity',
        validate: {
          min: { args: [1], msg: 'Minimum order quantity must be at least 1' },
        },
      },
      stockQuantity: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'stock_quantity',
        validate: {
          min: { args: [0], msg: 'Stock quantity cannot be negative' },
        },
      },
      isAvailable: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_available',
      },
      isFeatured: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_featured',
      },
      isNew: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_new',
      },
    },
    {
      tableName: 'products',
      timestamps: true,
      paranoid: true, // Enable soft-deletes (deleted_at)
      underscored: true,
    }
  );

  return Product;
};
