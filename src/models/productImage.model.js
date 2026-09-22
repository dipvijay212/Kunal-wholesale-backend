const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProductImage = sequelize.define(
    'ProductImage',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'product_id',
        references: {
          model: 'products',
          key: 'id',
        },
      },
      imageUrl: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'image_url',
        validate: {
          notEmpty: { msg: 'Image URL is required' },
        },
      },
      altText: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'alt_text',
      },
      displayOrder: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'display_order',
      },
    },
    {
      tableName: 'product_images',
      timestamps: true,
      underscored: true,
    }
  );

  return ProductImage;
};
