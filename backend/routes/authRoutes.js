const express = require('express');
const { registerUser, loginUser, getCurrentUser } = require('../controllers/authControllerLowdb');
const { protect } = require('../middleware/auth');

const router = express.Router();

// 公共路由
router.post('/register', registerUser);
router.post('/login', loginUser);

// 受保护的路由
router.get('/me', protect, getCurrentUser);

module.exports = router;