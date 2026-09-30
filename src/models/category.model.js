const { DataTypes } = require('sequelize');
const { englishOnlyHooks } = require('../utils/englishOnly');
const { cloudinaryUrlValidator } = require('../utils/mediaUrl');

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
      imageUrl: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'image_url',
        validate: { isCloudinaryUrl: cloudinaryUrlValidator },
      },
      // Optional SEO overrides; the storefront generates both when empty.
      seoTitle: {
        type: DataTypes.STRING(120),
        allowNull: true,
        field: 'seo_title',
        validate: { len: { args: [0, 120], msg: 'SEO title must be 120 characters or fewer' } },
      },
      seoDescription: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'seo_description',
        validate: { len: { args: [0, 320], msg: 'SEO description must be 320 characters or fewer' } },
      },
    },
    {
      tableName: 'categories',
      timestamps: true,
      underscored: true,
      // English-only catalogue: *_hi columns stay NULL and Hindi script is rejected.
      hooks: englishOnlyHooks({
        hindiFields: ['nameHi', 'descriptionHi'],
        englishFields: {
          name: 'Category name',
          nameEn: 'Category name',
          description: 'Category description',
          descriptionEn: 'Category description',
          seoTitle: 'SEO title',
          seoDescription: 'SEO description',
        },
      }),
    }
  );

  return Category;
};
