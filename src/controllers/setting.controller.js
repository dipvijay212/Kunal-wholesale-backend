const { WebsiteSetting } = require('../models');
const { sendSuccess } = require('../utils/apiResponse');
const AppError = require('../utils/appError');

const SUPPORTED_LANGUAGES = ['hi', 'en'];

/**
 * Helper to ensure at least one setting row exists
 */
const getOrCreateSettings = async () => {
  let settings = await WebsiteSetting.findOne();
  if (!settings) {
    settings = await WebsiteSetting.create({
      defaultLanguage: 'hi',
      availableLanguages: ['hi', 'en'],
      allowCustomerLanguageSwitch: true,
    });
  }
  return settings;
};

/**
 * GET /api/settings/language
 * Public endpoint returning safe language settings
 */
const getPublicLanguageSettings = async (req, res, next) => {
  try {
    const settings = await getOrCreateSettings();
    return sendSuccess(res, 'Language settings retrieved', {
      defaultLanguage: settings.defaultLanguage,
      availableLanguages: settings.availableLanguages,
      allowCustomerLanguageSwitch: settings.allowCustomerLanguageSwitch,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/settings/language
 * Admin endpoint returning language settings
 */
const getAdminLanguageSettings = async (req, res, next) => {
  try {
    const settings = await getOrCreateSettings();
    return sendSuccess(res, 'Admin language settings retrieved', {
      id: settings.id,
      defaultLanguage: settings.defaultLanguage,
      availableLanguages: settings.availableLanguages,
      allowCustomerLanguageSwitch: settings.allowCustomerLanguageSwitch,
      updatedAt: settings.updatedAt,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/settings/language
 * Admin endpoint to update language settings
 */
const updateAdminLanguageSettings = async (req, res, next) => {
  try {
    const { defaultLanguage, availableLanguages, allowCustomerLanguageSwitch } = req.body;

    const settings = await getOrCreateSettings();

    // Validation
    if (availableLanguages !== undefined) {
      if (!Array.isArray(availableLanguages) || availableLanguages.length === 0) {
        throw new AppError('availableLanguages must be a non-empty array', 400);
      }
      for (const lang of availableLanguages) {
        if (!SUPPORTED_LANGUAGES.includes(lang)) {
          throw new AppError(`Unsupported language: ${lang}. Supported: ${SUPPORTED_LANGUAGES.join(', ')}`, 400);
        }
      }
      settings.availableLanguages = availableLanguages;
    }

    if (defaultLanguage !== undefined) {
      const activeAvailable = availableLanguages || settings.availableLanguages;
      if (!activeAvailable.includes(defaultLanguage)) {
        throw new AppError(`defaultLanguage "${defaultLanguage}" must be included in availableLanguages`, 400);
      }
      settings.defaultLanguage = defaultLanguage;
    }

    if (allowCustomerLanguageSwitch !== undefined) {
      settings.allowCustomerLanguageSwitch = Boolean(allowCustomerLanguageSwitch);
    }

    await settings.save();

    return sendSuccess(res, 'Language settings updated successfully', {
      id: settings.id,
      defaultLanguage: settings.defaultLanguage,
      availableLanguages: settings.availableLanguages,
      allowCustomerLanguageSwitch: settings.allowCustomerLanguageSwitch,
      updatedAt: settings.updatedAt,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPublicLanguageSettings,
  getAdminLanguageSettings,
  updateAdminLanguageSettings,
};
