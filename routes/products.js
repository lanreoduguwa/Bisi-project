const express = require('express');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const { toCloud } = require('../config/cloudinary');
const { CATS } = require('../config/constant');

const router = express.Router();

// Public: every visitor sees this list.
router.get('/products', async (req, res) =>
  res.json(await Product.find().sort('-createdAt').select('-__v')));

// Admin: post a new product, with an optional photo uploaded to Cloudinary.
router.post('/admin/products', auth, upload.single('image'), async (req, res) => {
  const { name, category, price, description } = req.body;
  if (!name?.trim() || !CATS.includes(category) || price === '' || !(+price >= 0))
    return res.status(400).json({ error: 'Name, category and price are required' });

  const image = req.file ? await toCloud(req.file.buffer, 'becee/products') : undefined;
  res.status(201).json(await Product.create({ name, category, price: +price, description, image }));
});

// Admin: toggle in-stock / sold-out.
router.patch('/admin/products/:id/stock', auth, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.sendStatus(404);
  const p = await Product.findById(req.params.id);
  if (!p) return res.sendStatus(404);
  p.inStock = !p.inStock;
  await p.save();
  res.json(p);
});

// Admin: delete a product.
router.delete('/admin/products/:id', auth, async (req, res) => {
  if (mongoose.isValidObjectId(req.params.id)) await Product.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
