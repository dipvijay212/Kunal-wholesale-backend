'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Add reset password fields to customers table
    const customersTable = await queryInterface.describeTable('customers');
    if (!customersTable.reset_password_token) {
      await queryInterface.addColumn('customers', 'reset_password_token', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
    if (!customersTable.reset_password_expires) {
      await queryInterface.addColumn('customers', 'reset_password_expires', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }

    // 2. Add reset password fields to users (admin) table
    const usersTable = await queryInterface.describeTable('users');
    if (!usersTable.reset_password_token) {
      await queryInterface.addColumn('users', 'reset_password_token', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
    if (!usersTable.reset_password_expires) {
      await queryInterface.addColumn('users', 'reset_password_expires', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }
  },

  down: async (queryInterface) => {
    const customersTable = await queryInterface.describeTable('customers');
    if (customersTable.reset_password_token) {
      await queryInterface.removeColumn('customers', 'reset_password_token');
    }
    if (customersTable.reset_password_expires) {
      await queryInterface.removeColumn('customers', 'reset_password_expires');
    }

    const usersTable = await queryInterface.describeTable('users');
    if (usersTable.reset_password_token) {
      await queryInterface.removeColumn('users', 'reset_password_token');
    }
    if (usersTable.reset_password_expires) {
      await queryInterface.removeColumn('users', 'reset_password_expires');
    }
  },
};
