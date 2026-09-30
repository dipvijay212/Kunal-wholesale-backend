const express = require('express');
const { getPublicLanguageSettings, getPublicBusinessSettings } = require('../controllers/setting.controller');

const router = express.Router();

// GET /api/settings/language
router.get('/language', getPublicLanguageSettings);

// GET /api/settings/business
router.get('/business', getPublicBusinessSettings);

module.exports = router;
