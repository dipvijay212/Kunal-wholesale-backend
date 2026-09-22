'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('orders', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      order_number: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      customer_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      business_name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      whatsapp_number: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      city: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      state: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      pincode: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      total_items: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      subtotal: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      total_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      status: {
        type: Sequelize.ENUM(
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
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    await queryInterface.addIndex('orders', ['order_number'], {
      unique: true,
      name: 'orders_order_number_idx',
    });

    await queryInterface.addIndex('orders', ['status'], {
      name: 'orders_status_idx',
    });

    await queryInterface.addIndex('orders', ['created_at'], {
      name: 'orders_created_at_idx',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('orders');
  },
};
