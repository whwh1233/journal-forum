// Load test environment variables BEFORE any modules are imported
require('dotenv').config({ path: '.env.test' });

// Override NODE_ENV
process.env.NODE_ENV = 'test';
