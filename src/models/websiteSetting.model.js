const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const WebsiteSetting = sequelize.define(
    'WebsiteSetting',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      defaultLanguage: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: 'hi',
        field: 'default_language',
        validate: {
          isIn: {
            args: [['hi', 'en']],
            msg: 'defaultLanguage must be either "hi" or "en"',
          },
        },
      },
      availableLanguages: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: ['hi', 'en'],
        field: 'available_languages',
      },
      allowCustomerLanguageSwitch: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'allow_customer_language_switch',
      },
    },
    {
      tableName: 'website_settings',
      timestamps: true,
      underscored: true,
    }
  );

  return WebsiteSetting;
};
