'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Create customers table
    await queryInterface.createTable('customers', {
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
      business_name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      whatsapp_number: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
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
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
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

    // Add unique index on customers.phone
    await queryInterface.addIndex('customers', ['phone'], {
      unique: true,
      name: 'customers_phone_unique_idx',
    });

    // 2. Add customer_id column to orders table
    const tableInfo = await queryInterface.describeTable('orders');
    if (!tableInfo.customer_id) {
      await queryInterface.addColumn('orders', 'customer_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'customers',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });

      await queryInterface.addIndex('orders', ['customer_id'], {
        name: 'orders_customer_id_idx',
      });
    }
  },

  down: async (queryInterface) => {
    const tableInfo = await queryInterface.describeTable('orders');
    if (tableInfo.customer_id) {
      await queryInterface.removeColumn('orders', 'customer_id');
    }
    await queryInterface.dropTable('customers');
  },
};
