// Load base .env first, then .env.test overrides specific values
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.test', override: true });

// Override NODE_ENV
process.env.NODE_ENV = 'test';
