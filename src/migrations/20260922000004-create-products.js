'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('products', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      slug: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      product_code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      short_description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      category_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'categories',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      fabric: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      color: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      minimum_order_quantity: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
      },
      stock_quantity: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      is_available: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      is_featured: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      is_new: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      deleted_at: {
        allowNull: true,
        type: Sequelize.DATE,
      },
    });

    // Add indexes for products
    await queryInterface.addIndex('products', ['product_code'], {
      unique: true,
      name: 'products_product_code_idx',
    });

    await queryInterface.addIndex('products', ['slug'], {
      unique: true,
      name: 'products_slug_idx',
    });

    await queryInterface.addIndex('products', ['category_id'], {
      name: 'products_category_id_idx',
    });

    await queryInterface.addIndex('products', ['is_available'], {
      name: 'products_is_available_idx',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('products');
  },
};
