/**
 * Parse & sanitize pagination parameters
 * @param {Object} query - Express req.query
 * @returns {{page: number, limit: number, offset: number}}
 */
const getPagination = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  let limit = parseInt(query.limit, 10) || 12;

  // Enforce min 1 and max 50
  if (limit < 1) limit = 12;
  if (limit > 50) limit = 50;

  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

/**
 * Get Whitelisted Sorting Order for Sequelize
 * @param {string} sortBy - Sort key from req.query
 * @returns {Array} Sequelize order array
 */
const getSortOrder = (sortBy) => {
  const sortMap = {
    newest: [['created_at', 'DESC']],
    price_asc: [['price', 'ASC']],
    price_desc: [['price', 'DESC']],
    name_asc: [['name', 'ASC']],
  };

  return sortMap[sortBy] || sortMap.newest;
};

/**
 * Format Pagination Meta Response
 * @param {number} totalItems - Total record count
 * @param {number} page - Current page
 * @param {number} limit - Limit per page
 * @returns {{page: number, limit: number, total: number, totalPages: number}}
 */
const getPaginationMeta = (totalItems, page, limit) => {
  const totalPages = Math.ceil(totalItems / limit) || 1;
  return {
    page,
    limit,
    total: totalItems,
    totalPages,
  };
};

module.exports = {
  getPagination,
  getSortOrder,
  getPaginationMeta,
};
