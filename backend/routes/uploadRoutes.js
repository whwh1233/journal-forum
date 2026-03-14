const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { protect } = require('../middleware/auth');
const { upload, uploadImage } = require('../controllers/uploadController');

const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: { success: false, message: '上传过于频繁，请稍后再试' }
});

router.post(
  '/image',
  protect,
  uploadLimiter,
  (req, res, next) => {
    upload.single('image')(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ success: false, message: '图片大小不能超过 5MB' });
        }
        return res.status(400).json({ success: false, message: err.message || '上传失败' });
      }
      next();
    });
  },
  uploadImage
);

module.exports = router;
