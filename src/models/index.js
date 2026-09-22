const { sequelize } = require('../config/database');

// Import model definitions
const UserFactory = require('./user.model');
const CategoryFactory = require('./category.model');
const CollectionFactory = require('./collection.model');
const ProductFactory = require('./product.model');
const ProductImageFactory = require('./productImage.model');
const ProductCollectionFactory = require('./productCollection.model');
const OrderFactory = require('./order.model');
const OrderItemFactory = require('./orderItem.model');

// Initialize models
const User = UserFactory(sequelize);
const Category = CategoryFactory(sequelize);
const Collection = CollectionFactory(sequelize);
const Product = ProductFactory(sequelize);
const ProductImage = ProductImageFactory(sequelize);
const ProductCollection = ProductCollectionFactory(sequelize);
const Order = OrderFactory(sequelize);
const OrderItem = OrderItemFactory(sequelize);

// Set up Associations

// 1. Category <-> Product (One-to-Many)
Category.hasMany(Product, {
  foreignKey: 'categoryId',
  as: 'products',
  onDelete: 'SET NULL',
});
Product.belongsTo(Category, {
  foreignKey: 'categoryId',
  as: 'category',
});

// 2. Product <-> ProductImage (One-to-Many)
Product.hasMany(ProductImage, {
  foreignKey: 'productId',
  as: 'images',
  onDelete: 'CASCADE',
});
ProductImage.belongsTo(Product, {
  foreignKey: 'productId',
  as: 'product',
});

// 3. Product <-> Collection (Many-to-Many via ProductCollection)
Product.belongsToMany(Collection, {
  through: ProductCollection,
  foreignKey: 'productId',
  otherKey: 'collectionId',
  as: 'collections',
});
Collection.belongsToMany(Product, {
  through: ProductCollection,
  foreignKey: 'collectionId',
  otherKey: 'productId',
  as: 'products',
});

// 4. Order <-> OrderItem (One-to-Many)
Order.hasMany(OrderItem, {
  foreignKey: 'orderId',
  as: 'items',
  onDelete: 'CASCADE',
});
OrderItem.belongsTo(Order, {
  foreignKey: 'orderId',
  as: 'order',
});

// 5. Product <-> OrderItem (One-to-Many with SET NULL deletion safety)
Product.hasMany(OrderItem, {
  foreignKey: 'productId',
  as: 'orderItems',
  onDelete: 'SET NULL',
});
OrderItem.belongsTo(Product, {
  foreignKey: 'productId',
  as: 'product',
});

const db = {
  sequelize,
  User,
  Category,
  Collection,
  Product,
  ProductImage,
  ProductCollection,
  Order,
  OrderItem,
};

module.exports = db;
