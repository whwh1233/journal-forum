class StorageService {
  async upload(file, options = {}) { throw new Error('Not implemented'); }
  async delete(filename) { throw new Error('Not implemented'); }
  getUrl(filename) { throw new Error('Not implemented'); }
}

function createStorageService() {
  const type = process.env.STORAGE_TYPE || 'local';
  switch (type) {
    case 'local':
    default:
      const LocalStorage = require('./localStorage');
      return new LocalStorage();
  }
}

const storageService = createStorageService();
module.exports = { StorageService, storageService };
