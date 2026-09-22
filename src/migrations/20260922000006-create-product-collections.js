'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('product_collections', {
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
      collection_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'collections',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
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

    await queryInterface.addIndex('product_collections', ['product_id', 'collection_id'], {
      unique: true,
      name: 'product_collections_product_collection_unique',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('product_collections');
  },
};
