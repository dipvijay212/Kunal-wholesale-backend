const express = require('express');
const { getCollections, getCollectionBySlug } = require('../controllers/collection.controller');

const router = express.Router();

// GET /api/collections
router.get('/', getCollections);

// GET /api/collections/:slug
router.get('/:slug', getCollectionBySlug);

module.exports = router;
