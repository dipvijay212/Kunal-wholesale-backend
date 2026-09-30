const AppError = require('./appError');

/** Devanagari (Hindi) script. */
const DEVANAGARI = /[ऀ-ॿ]/;

/**
 * Catalogue data is stored in English only; the website translates its own interface
 * text, never database content. These model hooks:
 *  - always store the legacy Hindi columns (`*_hi`) as NULL, whatever a client sends;
 *  - reject Hindi script in the listed English fields with a clear 400 error.
 *
 * @param {object} options
 * @param {string[]} options.hindiFields   model attributes to force to NULL
 * @param {Record<string, string>} [options.englishFields]  attribute -> label for error messages
 */
const englishOnlyHooks = ({ hindiFields, englishFields = {} }) => {
  const clean = (instance) => {
    for (const field of hindiFields) {
      if (instance.get(field) !== null && instance.get(field) !== undefined) instance.set(field, null);
    }
    for (const [field, label] of Object.entries(englishFields)) {
      const value = instance.get(field);
      if (typeof value === 'string' && DEVANAGARI.test(value)) {
        throw new AppError(`${label} must be in English. Hindi text is not saved in the database.`, 400, { field });
      }
    }
  };

  return {
    beforeValidate: (instance) => clean(instance),
    beforeBulkCreate: (instances) => instances.forEach(clean),
  };
};

module.exports = { englishOnlyHooks, DEVANAGARI };
