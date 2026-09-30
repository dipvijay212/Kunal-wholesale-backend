const { WebsiteSetting } = require('../models');
const { sendSuccess } = require('../utils/apiResponse');
const AppError = require('../utils/appError');
const { hasAttribute } = require('../utils/optionalColumns');

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

/* -------------------------------------------------------------------------- */
/* Business contact settings                                                  */
/* -------------------------------------------------------------------------- */

const SOCIAL_PLATFORMS = ['instagram', 'facebook', 'youtube'];
const text = (value, max = 200) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

/**
 * Validates and normalises the admin payload into the stored shape. Only known fields
 * are kept, so the public endpoint can return the document as-is.
 */
const sanitizeBusinessSettings = (input = {}) => {
  const contact = input.contact || {};
  const address = contact.address || {};

  let whatsappNumber = text(contact.whatsappNumber, 20).replace(/\D/g, '').replace(/^0+/, '');
  if (whatsappNumber.length === 10) whatsappNumber = `91${whatsappNumber}`;
  if (whatsappNumber && (whatsappNumber.length < 11 || whatsappNumber.length > 15)) {
    throw new AppError('WhatsApp number must include the country code, e.g. 919876543210.', 400);
  }

  const email = text(contact.email, 120);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AppError('Please enter a valid email address.', 400);
  }

  const lines = (Array.isArray(address.lines) ? address.lines : String(address.lines || '').split('\n'))
    .map((line) => text(line, 120))
    .filter(Boolean)
    .slice(0, 4);

  const hours = (Array.isArray(contact.hours) ? contact.hours : [])
    .map((entry) => ({ days: text(entry && entry.days, 60), hours: text(entry && entry.hours, 60) }))
    .filter((entry) => entry.days && entry.hours)
    .slice(0, 7);

  const social = (Array.isArray(input.social) ? input.social : [])
    .map((link) => ({
      platform: text(link && link.platform, 20).toLowerCase(),
      label: text(link && link.label, 40),
      href: text(link && link.href, 300),
    }))
    .filter((link) => SOCIAL_PLATFORMS.includes(link.platform) && /^https:\/\//i.test(link.href));

  return {
    businessName: text(input.businessName, 80) || null,
    contact: {
      whatsappNumber: whatsappNumber || null,
      phoneDisplay: text(contact.phoneDisplay, 40) || null,
      email: email || null,
      address: {
        lines,
        city: text(address.city, 60),
        region: text(address.region, 60),
        postalCode: text(address.postalCode, 12),
        country: text(address.country, 60) || 'India',
      },
      hours,
    },
    social,
  };
};

/**
 * GET /api/settings/business
 * Public contact details shown on the storefront (null until saved in admin).
 */
const getPublicBusinessSettings = async (req, res, next) => {
  try {
    const settings = await getOrCreateSettings();
    return sendSuccess(res, 'Business settings retrieved', {
      businessSettings: settings.businessSettings || null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/settings/business
 * Admin endpoint to update business contact details
 */
const updateAdminBusinessSettings = async (req, res, next) => {
  try {
    if (!hasAttribute(WebsiteSetting, 'businessSettings')) {
      throw new AppError('Business settings storage is not set up yet. Run the database migration.', 503);
    }
    const settings = await getOrCreateSettings();
    settings.businessSettings = sanitizeBusinessSettings(req.body);
    settings.changed('businessSettings', true);
    await settings.save();

    return sendSuccess(res, 'Business settings updated successfully', {
      businessSettings: settings.businessSettings,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPublicBusinessSettings,
  updateAdminBusinessSettings,
  getPublicLanguageSettings,
  getAdminLanguageSettings,
  updateAdminLanguageSettings,
};
