'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Add multilingual fields to categories table
    const categoryTable = await queryInterface.describeTable('categories');
    
    if (!categoryTable.name_en) {
      await queryInterface.addColumn('categories', 'name_en', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
    if (!categoryTable.name_hi) {
      await queryInterface.addColumn('categories', 'name_hi', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
    if (!categoryTable.description_en) {
      await queryInterface.addColumn('categories', 'description_en', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }
    if (!categoryTable.description_hi) {
      await queryInterface.addColumn('categories', 'description_hi', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }

    // 2. Add multilingual fields to products table
    const productTable = await queryInterface.describeTable('products');

    if (!productTable.name_en) {
      await queryInterface.addColumn('products', 'name_en', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
    if (!productTable.name_hi) {
      await queryInterface.addColumn('products', 'name_hi', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
    if (!productTable.description_en) {
      await queryInterface.addColumn('products', 'description_en', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }
    if (!productTable.description_hi) {
      await queryInterface.addColumn('products', 'description_hi', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }
    if (!productTable.short_description_en) {
      await queryInterface.addColumn('products', 'short_description_en', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }
    if (!productTable.short_description_hi) {
      await queryInterface.addColumn('products', 'short_description_hi', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }
    if (!productTable.fabric_en) {
      await queryInterface.addColumn('products', 'fabric_en', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
    if (!productTable.fabric_hi) {
      await queryInterface.addColumn('products', 'fabric_hi', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
    if (!productTable.color_en) {
      await queryInterface.addColumn('products', 'color_en', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
    if (!productTable.color_hi) {
      await queryInterface.addColumn('products', 'color_hi', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    // 3. Add multilingual snapshot fields to order_items table
    const orderItemsTable = await queryInterface.describeTable('order_items');

    if (!orderItemsTable.product_name_en) {
      await queryInterface.addColumn('order_items', 'product_name_en', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
    if (!orderItemsTable.product_name_hi) {
      await queryInterface.addColumn('order_items', 'product_name_hi', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Revert products table columns
    await queryInterface.removeColumn('products', 'name_en').catch(() => {});
    await queryInterface.removeColumn('products', 'name_hi').catch(() => {});
    await queryInterface.removeColumn('products', 'description_en').catch(() => {});
    await queryInterface.removeColumn('products', 'description_hi').catch(() => {});
    await queryInterface.removeColumn('products', 'short_description_en').catch(() => {});
    await queryInterface.removeColumn('products', 'short_description_hi').catch(() => {});
    await queryInterface.removeColumn('products', 'fabric_en').catch(() => {});
    await queryInterface.removeColumn('products', 'fabric_hi').catch(() => {});
    await queryInterface.removeColumn('products', 'color_en').catch(() => {});
    await queryInterface.removeColumn('products', 'color_hi').catch(() => {});

    // Revert categories table columns
    await queryInterface.removeColumn('categories', 'name_en').catch(() => {});
    await queryInterface.removeColumn('categories', 'name_hi').catch(() => {});
    await queryInterface.removeColumn('categories', 'description_en').catch(() => {});
    await queryInterface.removeColumn('categories', 'description_hi').catch(() => {});

    // Revert order_items table columns
    await queryInterface.removeColumn('order_items', 'product_name_en').catch(() => {});
    await queryInterface.removeColumn('order_items', 'product_name_hi').catch(() => {});
  },
};
