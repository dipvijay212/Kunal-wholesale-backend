const { sequelize } = require('../config/database');

// Import model definitions
const UserFactory = require('./user.model');
const CustomerFactory = require('./customer.model');
const CategoryFactory = require('./category.model');
const ProductFactory = require('./product.model');
const ProductImageFactory = require('./productImage.model');
const OrderFactory = require('./order.model');
const OrderItemFactory = require('./orderItem.model');
const WebsiteSettingFactory = require('./websiteSetting.model');

// Initialize models
const User = UserFactory(sequelize);
const Customer = CustomerFactory(sequelize);
const Category = CategoryFactory(sequelize);
const Product = ProductFactory(sequelize);
const ProductImage = ProductImageFactory(sequelize);
const Order = OrderFactory(sequelize);
const OrderItem = OrderItemFactory(sequelize);
const WebsiteSetting = WebsiteSettingFactory(sequelize);

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

// 3. Customer <-> Order (One-to-Many)
Customer.hasMany(Order, {
  foreignKey: 'customerId',
  as: 'orders',
  onDelete: 'SET NULL',
});
Order.belongsTo(Customer, {
  foreignKey: 'customerId',
  as: 'customer',
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
  Customer,
  Category,
  Product,
  ProductImage,
  Order,
  OrderItem,
  WebsiteSetting,
};

module.exports = db;

