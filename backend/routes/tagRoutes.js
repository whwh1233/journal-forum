const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getTags, getHotTags, suggestTags, createTag } = require('../controllers/tagController');

router.get('/', getTags);
router.get('/hot', getHotTags);
router.get('/suggest', protect, suggestTags);
router.post('/', protect, createTag);

module.exports = router;
