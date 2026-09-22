'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Seed Categories
    await queryInterface.bulkInsert('categories', [
      {
        id: 1,
        name: 'Banarasi Silk',
        slug: 'banarasi-silk',
        description: 'Luxurious handcrafted Banarasi silk sarees with rich zari work.',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 2,
        name: 'Kanjivaram Silk',
        slug: 'kanjivaram-silk',
        description: 'Traditional pure mulberry silk sarees from Kanchipuram.',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 3,
        name: 'Georgette',
        slug: 'georgette',
        description: 'Lightweight flowy georgette sarees with intricate embroidery.',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 4,
        name: 'Organza',
        slug: 'organza',
        description: 'Sheer elegant organza sarees with floral prints and embroidery.',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    // 2. Seed Collections
    await queryInterface.bulkInsert('collections', [
      {
        id: 1,
        name: 'New Arrivals',
        slug: 'new-arrivals',
        description: 'Explore our latest wholesale saree collection.',
        image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 2,
        name: 'Bridal Edit',
        slug: 'bridal-edit',
        description: 'Exquisite bridal and wedding sarees for grand celebrations.',
        image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    // 3. Seed Products
    await queryInterface.bulkInsert('products', [
      {
        id: 1,
        name: 'Royal Crimson Banarasi Silk Saree',
        slug: 'royal-crimson-banarasi-silk-saree',
        product_code: 'KS-BAN-001',
        description: 'Woven with pure gold zari brocade across rich crimson red silk.',
        short_description: 'Pure Banarasi silk saree with gold zari work.',
        category_id: 1,
        fabric: 'Banarasi Silk',
        color: 'Red',
        price: 4999.00,
        minimum_order_quantity: 5,
        stock_quantity: 50,
        is_available: true,
        is_featured: true,
        is_new: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 2,
        name: 'Golden Yellow Kanjivaram Brocade Saree',
        slug: 'golden-yellow-kanjivaram-brocade-saree',
        product_code: 'KS-KAN-002',
        description: 'Classic yellow Kanjivaram silk saree featuring contrast maroon border.',
        short_description: 'Pure Kanjivaram silk with contrast border.',
        category_id: 2,
        fabric: 'Kanjivaram Silk',
        color: 'Yellow',
        price: 6500.00,
        minimum_order_quantity: 3,
        stock_quantity: 30,
        is_available: true,
        is_featured: true,
        is_new: false,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 3,
        name: 'Pastel Floral Organza Saree',
        slug: 'pastel-floral-organza-saree',
        product_code: 'KS-ORG-003',
        description: 'Hand-painted pastel pink organza saree with delicate cutwork border.',
        short_description: 'Lightweight organza saree with floral design.',
        category_id: 4,
        fabric: 'Organza',
        color: 'Pink',
        price: 2850.00,
        minimum_order_quantity: 10,
        stock_quantity: 100,
        is_available: true,
        is_featured: false,
        is_new: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    // 4. Seed Product Images
    await queryInterface.bulkInsert('product_images', [
      {
        id: 1,
        product_id: 1,
        image_url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c',
        alt_text: 'Royal Crimson Banarasi Silk Saree Main View',
        display_order: 1,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 2,
        product_id: 2,
        image_url: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2',
        alt_text: 'Golden Yellow Kanjivaram Saree Pallu View',
        display_order: 1,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    // 5. Seed Product Collections Junction
    await queryInterface.bulkInsert('product_collections', [
      {
        id: 1,
        product_id: 1,
        collection_id: 1, // New Arrivals
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 2,
        product_id: 1,
        collection_id: 2, // Bridal Edit
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 3,
        product_id: 2,
        collection_id: 2, // Bridal Edit
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('product_collections', null, {});
    await queryInterface.bulkDelete('product_images', null, {});
    await queryInterface.bulkDelete('products', null, {});
    await queryInterface.bulkDelete('collections', null, {});
    await queryInterface.bulkDelete('categories', null, {});
  },
};
