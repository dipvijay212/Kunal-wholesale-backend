// Explicit static requires for Vercel NFT bundler
require('pg');
try {
  require('pg-hstore');
} catch {}

const app = require('../src/app');

module.exports = app;
