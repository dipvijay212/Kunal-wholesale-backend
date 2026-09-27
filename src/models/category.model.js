const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Category = sequelize.define(
    'Category',
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
          notEmpty: { msg: 'Category name is required' },
        },
      },
      nameEn: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'name_en',
      },
      nameHi: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'name_hi',
      },
      slug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: {
          msg: 'Category slug must be unique',
        },
        validate: {
          notEmpty: { msg: 'Category slug is required' },
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      descriptionEn: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'description_en',
      },
      descriptionHi: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'description_hi',
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active',
      },
    },
    {
      tableName: 'categories',
      timestamps: true,
      underscored: true,
    }
  );

  return Category;
};
