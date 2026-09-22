'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('product_images', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      product_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'products',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      image_url: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      alt_text: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      display_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
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

    await queryInterface.addIndex('product_images', ['product_id'], {
      name: 'product_images_product_id_idx',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('product_images');
  },
};
