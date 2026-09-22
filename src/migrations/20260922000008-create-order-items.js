'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('order_items', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      order_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'orders',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      product_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'products',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      product_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      product_code: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      unit_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      subtotal: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    await queryInterface.addIndex('order_items', ['order_id'], {
      name: 'order_items_order_id_idx',
    });

    await queryInterface.addIndex('order_items', ['product_id'], {
      name: 'order_items_product_id_idx',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('order_items');
  },
};
