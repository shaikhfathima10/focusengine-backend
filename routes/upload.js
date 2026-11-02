const router = require('express').Router();
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { v2: cloudinary } = require('cloudinary');
const auth = require('../middleware/auth');

const EXT = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp', 'image/gif': '.gif' };
const fileFilter = (_req, file, cb) =>
  EXT[file.mimetype] ? cb(null, true) : cb(Object.assign(new Error('Only png, jpg, webp or gif images'), { status: 400 }));
const limits = { fileSize: 2 * 1024 * 1024 };

// Production: CLOUDINARY_URL is set, images go to Cloudinary (survive restarts and redeploys).
// Local development: no CLOUDINARY_URL, images are saved in the uploads/ folder.
const cloud = !!process.env.CLOUDINARY_URL;
let storage;
if (cloud) {
  storage = multer.memoryStorage();
} else {
  const dir = path.join(__dirname, '..', 'uploads');
  fs.mkdirSync(dir, { recursive: true });
  storage = multer.diskStorage({
    destination: dir,
    filename: (_req, file, cb) => cb(null, crypto.randomBytes(16).toString('hex') + EXT[file.mimetype]), // never trust the original name
  });
}
const upload = multer({ storage, limits, fileFilter });

// Field name must be "image". Returns { url } to store on a profile or send in chat.
router.post('/', auth, upload.single('image'), (req, res, next) => {
  if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
  if (!cloud) return res.status(201).json({ url: `/uploads/${req.file.filename}` });
  const stream = cloudinary.uploader.upload_stream({ folder: 'focusengine', resource_type: 'image' }, (err, result) => {
    if (err) return next(err);
    res.status(201).json({ url: result.secure_url });
  });
  stream.end(req.file.buffer);
});

module.exports = router;
