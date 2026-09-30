// Loads .env and makes sure every required setting is present before anything else runs.
require('dotenv').config();

const REQUIRED = ['MONGO_URI', 'JWT_SECRET', 'ADMIN_EMAIL', 'ADMIN_PASSWORD_HASH', 'CLOUDINARY_URL', 'WHATSAPP_NUMBER'];

for (const key of REQUIRED) {
  if (!process.env[key]) {
    console.error('Missing env var: ' + key);
    process.exit(1);
  }
}

module.exports = process.env;