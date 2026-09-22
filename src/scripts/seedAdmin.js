const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const { User, sequelize } = require('../models');

const seedAdmin = async () => {
  try {
    console.log('[Seed Admin] Verifying database connection...');
    await sequelize.authenticate();

    const name = process.env.ADMIN_NAME || 'Kunal Sarees Admin';
    const email = (process.env.ADMIN_EMAIL || 'admin@kunalsarees.com').toLowerCase().trim();
    const password = process.env.ADMIN_PASSWORD || 'AdminPass@2026';

    if (!password || password === 'change_this_secure_password_here') {
      console.warn('⚠️ [Warning] Please set a strong ADMIN_PASSWORD in your backend/.env file!');
    }

    // Check if user already exists
    const existingAdmin = await User.findOne({ where: { email } });

    if (existingAdmin) {
      console.log(`✅ [Seed Admin] Admin user already exists with email: ${email}`);
      process.exit(0);
    }

    // Create Admin User (Sequelize beforeCreate hook automatically hashes password)
    const admin = await User.create({
      name,
      email,
      password,
      role: 'admin',
      isActive: true,
    });

    console.log(`🎉 [Seed Admin] Initial Admin user created successfully!`);
    console.log(`   ID:    ${admin.id}`);
    console.log(`   Name:  ${admin.name}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role:  ${admin.role}`);
    console.log(`   Password: (hashed securely in MySQL)`);

    process.exit(0);
  } catch (error) {
    console.error('❌ [Seed Admin Error] Failed to create admin user:', error.message);
    process.exit(1);
  }
};

seedAdmin();
