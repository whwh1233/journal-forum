const path = require('path');
const fs = require('fs');

class LocalStorage {
  constructor() {
    this.uploadDir = path.join(__dirname, '..', 'uploads', 'images');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async upload(file, options = {}) {
    const filename = file.filename;
    const url = `/uploads/images/${filename}`;
    return { url, filename };
  }

  async delete(filename) {
    const filePath = path.join(this.uploadDir, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  }

  getUrl(filename) {
    return `/uploads/images/${filename}`;
  }
}

module.exports = LocalStorage;
