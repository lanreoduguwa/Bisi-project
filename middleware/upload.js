const multer = require('multer');

// Photos land in memory (not on disk) so they can be streamed straight to Cloudinary.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) =>
    /^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)
      ? cb(null, true)
      : cb(new Error('Only JPG, PNG, WEBP or GIF images are allowed'))
});

module.exports = upload;