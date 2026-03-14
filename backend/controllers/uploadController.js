const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { storageService } = require('../services/storageService');

const uploadDir = path.join(__dirname, '..', 'uploads', 'images');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `img-${req.user.id}-${uniqueSuffix}${ext}`);
  }
});

const allowedTypes = /jpeg|jpg|png|gif|webp/;

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('只允许上传图片文件 (jpeg, jpg, png, gif, webp)'));
  }
});

const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: '请选择要上传的图片' });
    }
    const { url, filename } = await storageService.upload(req.file);
    res.status(200).json({ success: true, data: { url, filename } });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ success: false, message: '图片上传失败' });
  }
};

module.exports = { upload, uploadImage };
