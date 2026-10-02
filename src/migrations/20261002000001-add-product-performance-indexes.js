'use strict';

/**
 * Performance indexes on the products table for fast filtering and sorting:
 * - is_available + is_featured (Homepage featured queries)
 * - is_available + is_new (New arrivals queries)
 * - is_available + created_at (Default 'newest' sort)
 * - is_available + price (Price range filter & price sort)
 * - fabric (Fabric filtering)
 */
module.exports = {
  up: async (queryInterface) => {
    // Helper to safely add an index if it doesn't already exist
    const safeAddIndex = async (table, fields, options) => {
      try {
        await queryInterface.addIndex(table, fields, options);
      } catch (err) {
        // If index already exists or table dialect doesn't support, skip gracefully
        console.warn(`[Migration Index Warning] Could not add index ${options?.name}:`, err.message);
      }
    };

    await safeAddIndex('products', ['is_available', 'is_featured'], {
      name: 'products_avail_featured_idx',
    });

    await safeAddIndex('products', ['is_available', 'is_new'], {
      name: 'products_avail_new_idx',
    });

    await safeAddIndex('products', ['is_available', 'created_at'], {
      name: 'products_avail_created_at_idx',
    });

    await safeAddIndex('products', ['is_available', 'price'], {
      name: 'products_avail_price_idx',
    });

    await safeAddIndex('products', ['fabric'], {
      name: 'products_fabric_idx',
    });
  },

  down: async (queryInterface) => {
    const safeRemoveIndex = async (table, name) => {
      try {
        await queryInterface.removeIndex(table, name);
      } catch (err) {
        console.warn(`[Migration Index Warning] Could not remove index ${name}:`, err.message);
      }
    };

    await safeRemoveIndex('products', 'products_avail_featured_idx');
    await safeRemoveIndex('products', 'products_avail_new_idx');
    await safeRemoveIndex('products', 'products_avail_created_at_idx');
    await safeRemoveIndex('products', 'products_avail_price_idx');
    await safeRemoveIndex('products', 'products_fabric_idx');
  },
};
