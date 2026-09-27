const express = require('express');
const { getPublicLanguageSettings } = require('../controllers/setting.controller');

const router = express.Router();

// GET /api/settings/language
router.get('/language', getPublicLanguageSettings);

module.exports = router;
