const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  const Customer = sequelize.define(
    'Customer',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Customer name is required' },
        },
      },
      businessName: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'business_name',
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: {
          msg: 'Mobile number is already registered',
        },
        validate: {
          notEmpty: { msg: 'Mobile number is required' },
        },
      },
      whatsappNumber: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'whatsapp_number',
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isEmailOptional(value) {
            if (value && !/\S+@\S+\.\S+/.test(value)) {
              throw new Error('Please enter a valid email address');
            }
          },
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: {
            args: [8, 100],
            msg: 'Password must be at least 8 characters long',
          },
        },
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Address is required' },
        },
      },
      city: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      state: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      pincode: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active',
      },
      resetPasswordToken: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'reset_password_token',
      },
      resetPasswordExpires: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'reset_password_expires',
      },
    },
    {
      tableName: 'customers',
      timestamps: true,
      underscored: true,
      hooks: {
        beforeCreate: async (customer) => {
          if (customer.password && !customer.password.startsWith('$2')) {
            const salt = await bcrypt.genSalt(10);
            customer.password = await bcrypt.hash(customer.password, salt);
          }
        },
        beforeUpdate: async (customer) => {
          if (customer.changed('password') && customer.password && !customer.password.startsWith('$2')) {
            const salt = await bcrypt.genSalt(10);
            customer.password = await bcrypt.hash(customer.password, salt);
          }
        },
      },
    }
  );

  // Instance method to compare candidate password with stored hash
  Customer.prototype.comparePassword = async function (candidatePassword) {
    if (!this.password) return false;
    return await bcrypt.compare(candidatePassword, this.password);
  };

  // Custom toJSON method to strip password and reset token fields from responses
  Customer.prototype.toJSON = function () {
    const values = { ...this.get() };
    delete values.password;
    delete values.passwordHash;
    delete values.resetPasswordToken;
    delete values.resetPasswordExpires;
    delete values.reset_password_token;
    delete values.reset_password_expires;
    return values;
  };

  return Customer;
};
