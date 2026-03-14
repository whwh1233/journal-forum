const express = require('express');
const router = express.Router();
const { getCategories } = require('../controllers/postCategoryController');

router.get('/', getCategories);

module.exports = router;
