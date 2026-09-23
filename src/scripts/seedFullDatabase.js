const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const {
  sequelize,
  User,
  Category,
  Collection,
  Product,
  ProductImage,
  ProductCollection,
  Order,
  OrderItem,
} = require('../models');

const unsplashUrl = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=85`;

const categoriesData = [
  {
    id: 1,
    name: 'Silk Sarees',
    slug: 'silk-sarees',
    description: 'Pure silk weaves with structure and sheen — Kanjivaram, Tussar and satin silks that hold their drape and sell year after year.',
    isActive: true,
  },
  {
    id: 2,
    name: 'Banarasi Sarees',
    slug: 'banarasi-sarees',
    description: 'Katan and tanchoi silks woven in Varanasi, with dense zari work and clean selvedges. The dependable core of a festive assortment.',
    isActive: true,
  },
  {
    id: 3,
    name: 'Georgette Sarees',
    slug: 'georgette-sarees',
    description: 'Fluid georgettes that move well and travel light. Easy to wear, easy to sell and priced for steady repeat orders.',
    isActive: true,
  },
  {
    id: 4,
    name: 'Cotton Sarees',
    slug: 'cotton-sarees',
    description: 'Breathable handloom cottons, Chanderi and Jamdani weaves for daily wear, office wear and daytime functions.',
    isActive: true,
  },
  {
    id: 5,
    name: 'Organza Sarees',
    slug: 'organza-sarees',
    description: 'Crisp, sheer organza in soft pastels with pearl, sequin and thread work. Light on the shoulder, strong on the shelf.',
    isActive: true,
  },
  {
    id: 6,
    name: 'Chiffon Sarees',
    slug: 'chiffon-sarees',
    description: 'Featherlight chiffons and crepes with soft dyes and fine borders, for customers who want comfort without losing polish.',
    isActive: true,
  },
  {
    id: 7,
    name: 'Printed Sarees',
    slug: 'printed-sarees',
    description: 'Digital prints, bandhani and hand block work in repeatable designs — the fastest-moving shelf in most stores.',
    isActive: true,
  },
  {
    id: 8,
    name: 'Embroidered Sarees',
    slug: 'embroidered-sarees',
    description: 'Hand embroidery, zardozi, cutdana and thread work on silk, satin and tissue bases for weddings and receptions.',
    isActive: true,
  },
  {
    id: 9,
    name: 'Party Wear',
    slug: 'party-wear',
    description: 'Shimmer satins, ruffles, sequins and metallic tissues for evening functions, sangeet nights and receptions.',
    isActive: true,
  },
  {
    id: 10,
    name: 'Bridal Sarees',
    slug: 'bridal-sarees',
    description: 'Heirloom bridal weaves in crimson, maroon and gold with hand zardozi and real zari, built for the main wedding day.',
    isActive: true,
  },
];

const collectionsData = [
  {
    id: 1,
    name: 'Banarasi Sarees',
    slug: 'banarasi-sarees',
    description: 'Our top Banarasi weaves — pure katan silk, real zari and jaal pallus, sourced directly from master weavers.',
    image: unsplashUrl('1641699862936-be9f49b1c38d'),
    isActive: true,
  },
  {
    id: 2,
    name: 'Silk Sarees',
    slug: 'silk-sarees',
    description: 'Structured silks for customers who buy once and keep for decades. Temple borders, korvai contrasts and handloom Tussar.',
    image: unsplashUrl('1679006831648-7c9ea12e5807'),
    isActive: true,
  },
  {
    id: 3,
    name: 'Georgette Sarees',
    slug: 'georgette-sarees',
    description: 'Fluid georgettes that move well and travel light. Easy to wear, easy to sell and priced for steady repeat orders.',
    image: unsplashUrl('1617055407123-3d7130c1f940'),
    isActive: true,
  },
  {
    id: 4,
    name: 'Cotton Sarees',
    slug: 'cotton-sarees',
    description: 'Breathable handloom cottons, Chanderi and Jamdani weaves for daily wear, boutique collections, and daytime wear.',
    image: unsplashUrl('1774437561949-17b3bcf88db9'),
    isActive: true,
  },
  {
    id: 5,
    name: 'Organza Sarees',
    slug: 'organza-sarees',
    description: 'Crisp, sheer organza in soft pastels with pearl, sequin and thread work. Light on the shoulder, strong on the shelf.',
    image: unsplashUrl('1770199105820-2e12ecee91a1'),
    isActive: true,
  },
  {
    id: 6,
    name: 'Bridal Collection',
    slug: 'bridal-collection',
    description: 'Statement bridal sarees in heavy zari and zardozi handwork, supplied in presentation boxes and available as single pieces.',
    image: unsplashUrl('1570212773364-e30cd076539e'),
    isActive: true,
  },
];

const productsData = [
  {
    id: 1,
    name: 'Aaranya Temple Border Kanjivaram Saree',
    slug: 'aaranya-temple-border-kanjivaram-saree',
    productCode: 'KS-SLK-1001',
    categoryId: 1,
    collectionId: 2,
    fabric: 'Kanjivaram Silk',
    color: 'Antique Ochre, Deep Wine, Peacock Teal',
    price: 7850,
    minimumOrderQuantity: 2,
    stockQuantity: 42,
    shortDescription: 'Structured mulberry silk with a classic temple border.',
    description: 'A structured mulberry silk Kanjivaram with a classic temple border and a heavy zari pallu. The base reads warm under both daylight and stage lighting, which makes it a safe pick for wedding-season stock.',
    isAvailable: true,
    isFeatured: true,
    isNew: false,
    photoIds: ['1679006831648-7c9ea12e5807', '1619043518800-7f14be467dca', '1771074153149-6b32d0b420bc'],
  },
  {
    id: 2,
    name: 'Meenakshi Korvai Silk Saree',
    slug: 'meenakshi-korvai-silk-saree',
    productCode: 'KS-SLK-1002',
    categoryId: 1,
    collectionId: 2,
    fabric: 'Kanjivaram Silk',
    color: 'Peacock Teal, Maroon',
    price: 8450,
    minimumOrderQuantity: 2,
    stockQuantity: 18,
    shortDescription: 'Korvai interlocked border that never frays at the join.',
    description: 'The border is interlocked with the body using the korvai technique, so the contrast stays sharp and the join holds up to years of wear. Peacock teal with a deep magenta and gold border.',
    isAvailable: true,
    isFeatured: false,
    isNew: true,
    photoIds: ['1778882482057-ab3e1b9db8ff', '1606259457945-67dc66271ee6', '1786871204247-60f342ae81a8'],
  },
  {
    id: 3,
    name: 'Sanjh Tussar Handloom Saree',
    slug: 'sanjh-tussar-handloom-saree',
    productCode: 'KS-SLK-1003',
    categoryId: 1,
    collectionId: 2,
    fabric: 'Tussar Silk',
    color: 'Mustard, Rust, Ivory',
    price: 3450,
    minimumOrderQuantity: 4,
    stockQuantity: 60,
    shortDescription: 'Textured Tussar silk with a fine ghicha zari border.',
    description: 'Handwoven Tussar with the slightly uneven texture that buyers of handloom look for, finished with a narrow ghicha zari border. Lighter than a Kanjivaram and comfortable through a full day.',
    isAvailable: true,
    isFeatured: false,
    isNew: false,
    photoIds: ['1619516388835-2b60acc4049e', '1631737859822-d954fbb08f5f', '1759738096144-b43206226765'],
  },
  {
    id: 4,
    name: 'Aarna Katan Banarasi Silk Saree',
    slug: 'aarna-katan-banarasi-silk-saree',
    productCode: 'KS-BNS-1004',
    categoryId: 2,
    collectionId: 1,
    fabric: 'Banarasi Silk',
    color: 'Deep Wine, Emerald, Midnight Navy, Sindoor Red',
    price: 4850,
    minimumOrderQuantity: 4,
    stockQuantity: 96,
    shortDescription: 'Pure katan silk with an antique gold zari jaal pallu.',
    description: 'A pure katan silk with a soft sheen and a close, even weave. Antique gold zari florals run through the body and open into a full jaal pallu — a reliable wedding-season seller.',
    isAvailable: true,
    isFeatured: true,
    isNew: false,
    photoIds: ['1641699862936-be9f49b1c38d', '1771074153149-6b32d0b420bc', '1763400126795-d83e07d3449e'],
  },
  {
    id: 5,
    name: 'Meher Tanchoi Banarasi Saree',
    slug: 'meher-tanchoi-banarasi-saree',
    productCode: 'KS-BNS-1005',
    categoryId: 2,
    collectionId: 1,
    fabric: 'Banarasi Silk',
    color: 'Emerald, Plum, Midnight Navy',
    price: 5600,
    minimumOrderQuantity: 4,
    stockQuantity: 48,
    shortDescription: 'Tone-on-tone tanchoi weave with a fine zari border.',
    description: 'Tanchoi weaving gives this saree a tone-on-tone texture that catches the light without heavy zari. Lighter than a katan and easier to wear through a long evening.',
    isAvailable: true,
    isFeatured: false,
    isNew: true,
    photoIds: ['1769165404846-2b81840f5b71', '1619043599439-9b750b7b2623', '1788015737547-c54a34cbd562'],
  },
  {
    id: 6,
    name: 'Noor Silver Zari Banarasi Saree',
    slug: 'noor-silver-zari-banarasi-saree',
    productCode: 'KS-BNS-1006',
    categoryId: 2,
    collectionId: 1,
    fabric: 'Banarasi Silk',
    color: 'Midnight Navy, Onyx Black, Silver Grey',
    price: 5250,
    minimumOrderQuantity: 4,
    stockQuantity: 24,
    shortDescription: 'Midnight silk with silver zari butis for evening wear.',
    description: 'Midnight navy silk with silver zari butis and a restrained border. A cooler alternative to gold for customers dressing for receptions and evening functions.',
    isAvailable: true,
    isFeatured: false,
    isNew: false,
    photoIds: ['1600312914724-0c318dd0eb29', '1686175600613-2093947b8639', '1630512874316-88dcd1925237'],
  },
  {
    id: 7,
    name: 'Rhea Sequin Georgette Saree',
    slug: 'rhea-sequin-georgette-saree',
    productCode: 'KS-GRG-1007',
    categoryId: 3,
    collectionId: 3,
    fabric: 'Georgette',
    color: 'Onyx Black, Deep Wine, Midnight Navy, Silver Grey',
    price: 1850,
    minimumOrderQuantity: 8,
    stockQuantity: 160,
    shortDescription: 'All-over silver sequin trail on fluid georgette.',
    description: 'Onyx georgette with an all-over silver sequin trail that falls in clean lines. A consistent party-wear performer that sells across age groups.',
    isAvailable: true,
    isFeatured: true,
    isNew: false,
    photoIds: ['1572470176170-98fa8abcb741', '1617055407123-3d7130c1f940', '1630512874316-88dcd1925237'],
  },
  {
    id: 8,
    name: 'Kaia Mirror Work Georgette Saree',
    slug: 'kaia-mirror-work-georgette-saree',
    productCode: 'KS-GRG-1008',
    categoryId: 3,
    collectionId: 3,
    fabric: 'Georgette',
    color: 'Rani Pink, Antique Ochre, Peacock Teal',
    price: 2100,
    minimumOrderQuantity: 6,
    stockQuantity: 72,
    shortDescription: 'Real foil mirror scalloped border for festive events.',
    description: 'Foil mirrors set in threadwork along a scalloped border. Vivid jewel tones that photograph well under festive lighting.',
    isAvailable: true,
    isFeatured: false,
    isNew: true,
    photoIds: ['1617055407123-3d7130c1f940', '1583391733956-6c78276477e2', '1610030469983-98e550d6193c'],
  },
  {
    id: 9,
    name: 'Mira Handloom Chanderi Cotton Silk Saree',
    slug: 'mira-handloom-chanderi-cotton-silk-saree',
    productCode: 'KS-CTN-1009',
    categoryId: 4,
    collectionId: 4,
    fabric: 'Chanderi Cotton Silk',
    color: 'Ivory, Blush, Antique Ochre, Sage',
    price: 1650,
    minimumOrderQuantity: 10,
    stockQuantity: 120,
    shortDescription: 'Translucent Chanderi with delicate zari butis.',
    description: 'A breathable cotton-silk blend with the crisp drape Chanderi is known for. Subtle gold zari butis make it versatile for daytime events and festive wear.',
    isAvailable: true,
    isFeatured: true,
    isNew: false,
    photoIds: ['1774437561949-17b3bcf88db9', '1615799998603-7c6270a45196', '1679006831648-7c9ea12e5807'],
  },
  {
    id: 10,
    name: 'Anandi Pastel Organza Embroidered Saree',
    slug: 'anandi-pastel-organza-embroidered-saree',
    productCode: 'KS-ORG-1010',
    categoryId: 5,
    collectionId: 5,
    fabric: 'Organza',
    color: 'Blush, Sage, Lavender, Powder Blue',
    price: 2450,
    minimumOrderQuantity: 6,
    stockQuantity: 84,
    shortDescription: 'Sheer pastel organza with cutwork pearl floral border.',
    description: 'Soft organza that holds a neat silhouette with intricate thread and pearl cutwork along the border. Highly popular for daytime weddings and boutique curation.',
    isAvailable: true,
    isFeatured: true,
    isNew: true,
    photoIds: ['1770199105820-2e12ecee91a1', '1610030469983-98e550d6193c', '1786871204247-60f342ae81a8'],
  },
  {
    id: 11,
    name: 'Riddhi Heirloom Bridal Zardozi Silk Saree',
    slug: 'riddhi-heirloom-bridal-zardozi-silk-saree',
    productCode: 'KS-BRL-1011',
    categoryId: 10,
    collectionId: 6,
    fabric: 'Banarasi Silk',
    color: 'Sindoor Red, Deep Wine, Maroon',
    price: 12500,
    minimumOrderQuantity: 1,
    stockQuantity: 15,
    shortDescription: 'Handcrafted zardozi bridal saree in pure silk with rich velvet border.',
    description: 'Masterpiece bridal saree featuring dense hand-embroidered zardozi, dabka, and real semi-precious stone work. Delivered in luxury wooden presentation casing.',
    isAvailable: true,
    isFeatured: true,
    isNew: false,
    photoIds: ['1570212773364-e30cd076539e', '1583391733956-6c78276477e2', '1641699862936-be9f49b1c38d'],
  },
  {
    id: 12,
    name: 'Tara Pure Tissue Silk Metallic Saree',
    slug: 'tara-pure-tissue-silk-metallic-saree',
    productCode: 'KS-TSS-1012',
    categoryId: 1,
    collectionId: 2,
    fabric: 'Tissue Silk',
    color: 'Champagne Gold, Silver Grey, Antique Ochre',
    price: 6200,
    minimumOrderQuantity: 3,
    stockQuantity: 36,
    shortDescription: 'Luminous metallic tissue silk with delicate scalloped edges.',
    description: 'High-shine woven metallic tissue saree that offers magnificent volume and reflective sheen under evening lighting.',
    isAvailable: true,
    isFeatured: false,
    isNew: true,
    photoIds: ['1619043518800-7f14be467dca', '1600312914724-0c318dd0eb29', '1771074153149-6b32d0b420bc'],
  },
];

async function seedFullDatabase() {
  try {
    console.log('🔄 Initializing database schema...');
    await sequelize.sync({ force: true });
    console.log('✅ Database synchronized cleanly.');

    // 1. Seed Admin User
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@kunalsarees.com').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
    const adminName = process.env.ADMIN_NAME || 'Kunal Sarees Admin';

    await User.create({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      isActive: true,
    });
    console.log(`✅ Admin user created: ${adminEmail} (password: ${adminPassword})`);

    // 2. Seed Categories
    await Category.bulkCreate(categoriesData);
    console.log(`✅ Seeded ${categoriesData.length} saree categories.`);

    // 3. Seed Collections
    await Collection.bulkCreate(collectionsData);
    console.log(`✅ Seeded ${collectionsData.length} saree collections.`);

    // 4. Seed Products & Images & Junctions
    for (const prod of productsData) {
      const createdProduct = await Product.create({
        id: prod.id,
        name: prod.name,
        slug: prod.slug,
        productCode: prod.productCode,
        description: prod.description,
        shortDescription: prod.shortDescription,
        categoryId: prod.categoryId,
        fabric: prod.fabric,
        color: prod.color,
        price: prod.price,
        minimumOrderQuantity: prod.minimumOrderQuantity,
        stockQuantity: prod.stockQuantity,
        isAvailable: prod.isAvailable,
        isFeatured: prod.isFeatured,
        isNew: prod.isNew,
      });

      // Images
      if (prod.photoIds && prod.photoIds.length > 0) {
        const imagesToCreate = prod.photoIds.map((photoId, idx) => ({
          productId: createdProduct.id,
          imageUrl: unsplashUrl(photoId),
          altText: `${prod.name} - View ${idx + 1}`,
          displayOrder: idx + 1,
        }));
        await ProductImage.bulkCreate(imagesToCreate);
      }

      // Collection junction
      if (prod.collectionId) {
        await ProductCollection.create({
          productId: createdProduct.id,
          collectionId: prod.collectionId,
        });
      }
    }
    console.log(`✅ Seeded ${productsData.length} wholesale saree products with high-res galleries.`);

    // 5. Seed sample orders
    const sampleOrder = await Order.create({
      orderNumber: 'KS-20260923-0001',
      customerName: 'Priya Mehta',
      businessName: 'Aanchal Boutique',
      phone: '9825011223',
      whatsappNumber: '919825011223',
      email: 'priya@aanchalboutique.in',
      address: 'Shop 12, Heritage Square, CG Road',
      city: 'Ahmedabad',
      state: 'Gujarat',
      pincode: '380009',
      notes: 'Please ensure export quality packing and color assortment.',
      totalItems: 8,
      subtotal: 31400.0,
      totalAmount: 31400.0,
      status: 'confirmed',
    });

    await OrderItem.bulkCreate([
      {
        orderId: sampleOrder.id,
        productId: 1,
        productName: 'Aaranya Temple Border Kanjivaram Saree',
        productCode: 'KS-SLK-1001',
        unitPrice: 7850.0,
        quantity: 2,
        subtotal: 15700.0,
      },
      {
        orderId: sampleOrder.id,
        productId: 4,
        productName: 'Aarna Katan Banarasi Silk Saree',
        productCode: 'KS-BNS-1004',
        unitPrice: 4850.0,
        quantity: 2,
        subtotal: 9700.0,
      },
      {
        orderId: sampleOrder.id,
        productId: 7,
        productName: 'Rhea Sequin Georgette Saree',
        productCode: 'KS-GRG-1007',
        unitPrice: 1500.0,
        quantity: 4,
        subtotal: 6000.0,
      },
    ]);

    const sampleOrder2 = await Order.create({
      orderNumber: 'KS-20260923-0002',
      customerName: 'Rakesh Agarwal',
      businessName: 'Shree Saree Sadan',
      phone: '9427055810',
      whatsappNumber: '919427055810',
      email: 'shreesareesadan@gmail.com',
      address: '44 MT Cloth Market',
      city: 'Indore',
      state: 'Madhya Pradesh',
      pincode: '452002',
      notes: 'Urgent delivery required before Diwali season.',
      totalItems: 12,
      subtotal: 26400.0,
      totalAmount: 26400.0,
      status: 'pending',
    });

    await OrderItem.create({
      orderId: sampleOrder2.id,
      productId: 8,
      productName: 'Kaia Mirror Work Georgette Saree',
      productCode: 'KS-GRG-1008',
      unitPrice: 2200.0,
      quantity: 12,
      subtotal: 26400.0,
    });

    console.log('✅ Seeded initial wholesale customer orders.');
    console.log('🎉 Database setup and full seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding full database:', error);
    process.exit(1);
  }
}

seedFullDatabase();
