'use strict';

/**
 * Optional admin-controlled SEO overrides for category pages. When empty, the
 * storefront generates the title and description from the category data.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('categories');
    if (!table.seo_title) {
      await queryInterface.addColumn('categories', 'seo_title', {
        type: Sequelize.STRING(120),
        allowNull: true,
      });
    }
    if (!table.seo_description) {
      await queryInterface.addColumn('categories', 'seo_description', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }
  },

  down: async (queryInterface) => {
    const table = await queryInterface.describeTable('categories');
    if (table.seo_title) {
      await queryInterface.removeColumn('categories', 'seo_title');
    }
    if (table.seo_description) {
      await queryInterface.removeColumn('categories', 'seo_description');
    }
  },
};
