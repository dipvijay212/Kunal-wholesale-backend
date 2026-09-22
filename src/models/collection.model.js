const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Collection = sequelize.define(
    'Collection',
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
          notEmpty: { msg: 'Collection name is required' },
        },
      },
      slug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: {
          msg: 'Collection slug must be unique',
        },
        validate: {
          notEmpty: { msg: 'Collection slug is required' },
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      image: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active',
      },
    },
    {
      tableName: 'collections',
      timestamps: true,
      underscored: true,
    }
  );

  return Collection;
};
