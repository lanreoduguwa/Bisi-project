// The Cloudinary SDK reads CLOUDINARY_URL from the environment automatically,
// as long as config/env.js has already run (server.js requires it first).
const { v2: cloudinary } = require('cloudinary');

// Uploads a photo buffer to Cloudinary and resolves with its hosted URL.
function toCloud(buffer, folder) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image', transformation: [{ width: 1000, crop: 'limit', quality: 'auto', fetch_format: 'auto' }] },
      (err, result) => err ? reject(err) : resolve(result.secure_url)
    ).end(buffer);
  });
}

module.exports = { cloudinary, toCloud };