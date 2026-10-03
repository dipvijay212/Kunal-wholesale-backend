const { sequelize, Category, WebsiteSetting } = require('../models');

/**
 * Columns added by later migrations that the app can run without. If a database has
 * not been migrated yet, the attribute is dropped from the model so queries keep
 * working (the feature simply stays off) instead of failing with "column does not exist".
 * Run `npm run db:migrate` to enable them.
 */
const OPTIONAL_COLUMNS = [
  { model: Category, table: 'categories', attribute: 'seoTitle', column: 'seo_title' },
  { model: Category, table: 'categories', attribute: 'seoDescription', column: 'seo_description' },
  { model: WebsiteSetting, table: 'website_settings', attribute: 'businessSettings', column: 'business_settings' },
];

let checked;

const ensureOptionalColumns = () => {
  if (!checked) {
    checked = (async () => {
      // Look up each table once, in parallel (this runs before the first request of a cold start).
      const tableNames = [...new Set(OPTIONAL_COLUMNS.map((entry) => entry.table))];
      const descriptions = await Promise.all(
        tableNames.map((table) => sequelize.getQueryInterface().describeTable(table))
      );
      const tables = Object.fromEntries(tableNames.map((table, index) => [table, descriptions[index]]));
      for (const { model, table, attribute, column } of OPTIONAL_COLUMNS) {
        if (!tables[table][column] && model.rawAttributes[attribute]) {
          model.removeAttribute(attribute);
          console.warn(`[Schema] ${table}.${column} is missing — run "npm run db:migrate" to enable it.`);
        }
      }
    })().catch((error) => {
      checked = undefined; // retry on the next request
      console.error('[Schema] Optional column check failed:', error.message);
    });
  }
  return checked;
};

/** True when the attribute exists on the model (i.e. its column exists in the database). */
const hasAttribute = (model, attribute) => Boolean(model.rawAttributes[attribute]);

module.exports = { ensureOptionalColumns, hasAttribute };
