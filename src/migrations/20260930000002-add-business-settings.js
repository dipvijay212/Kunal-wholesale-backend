'use strict';

/**
 * Business contact details edited in Admin → Settings (name, phone/WhatsApp, email,
 * address, hours, social links). Stored as one JSON document; null until first saved,
 * in which case the storefront uses its built-in defaults.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('website_settings');
    if (!table.business_settings) {
      await queryInterface.addColumn('website_settings', 'business_settings', {
        type: Sequelize.JSON,
        allowNull: true,
      });
    }
  },

  down: async (queryInterface) => {
    const table = await queryInterface.describeTable('website_settings');
    if (table.business_settings) {
      await queryInterface.removeColumn('website_settings', 'business_settings');
    }
  },
};
