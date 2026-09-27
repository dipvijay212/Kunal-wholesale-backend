'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('website_settings', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      default_language: {
        type: Sequelize.STRING(10),
        allowNull: false,
        defaultValue: 'hi',
      },
      available_languages: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      allow_customer_language_switch: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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

    await queryInterface.bulkInsert('website_settings', [
      {
        default_language: 'hi',
        available_languages: JSON.stringify(['hi', 'en']),
        allow_customer_language_switch: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('website_settings');
  },
};
