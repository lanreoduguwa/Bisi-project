const express = require('express');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const Review = require('../models/Review');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const { toCloud } = require('../config/cloudinary');

const router = express.Router();

// Public: only approved reviews are ever shown to customers.
router.get('/reviews', async (req, res) =>
  res.json(await Review.find({ approved: true }).sort('-createdAt').limit(50).select('-__v -approved')));

// Public: a customer submits a review. It stays hidden until an admin approves it.
router.post('/reviews',
  rateLimit({ windowMs: 60 * 60 * 1000, max: 5, message: { error: 'Too many reviews, try again later' } }),
  upload.single('image'),
  async (req, res) => {
    const { name, text } = req.body, stars = Math.round(+req.body.stars);
    if (!name?.trim() || !text?.trim() || !(stars >= 1 && stars <= 5))
      return res.status(400).json({ error: 'Please fill in your name, rating and testimony' });

    const image = req.file ? await toCloud(req.file.buffer, 'becee/reviews') : undefined;
    await Review.create({ name, text, stars, image });
    res.status(201).json({ ok: true });
  });

// Admin: see every review, pending and approved.
router.get('/admin/reviews', auth, async (req, res) =>
  res.json(await Review.find().sort('approved -createdAt').select('-__v')));

// Admin: approve a pending review so it goes live.
router.patch('/admin/reviews/:id/approve', auth, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.sendStatus(404);
  res.json(await Review.findByIdAndUpdate(req.params.id, { approved: true }, { new: true }));
});

// Admin: delete a review.
router.delete('/admin/reviews/:id', auth, async (req, res) => {
  if (mongoose.isValidObjectId(req.params.id)) await Review.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
