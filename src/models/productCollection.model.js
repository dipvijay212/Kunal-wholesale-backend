const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProductCollection = sequelize.define(
    'ProductCollection',
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
      collectionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'collection_id',
        references: {
          model: 'collections',
          key: 'id',
        },
      },
    },
    {
      tableName: 'product_collections',
      timestamps: true,
      underscored: true,
    }
  );

  return ProductCollection;
};
