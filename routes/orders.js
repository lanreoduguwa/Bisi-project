const express = require('express');
const crypto = require('crypto');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const Product = require('../models/Product');
const Order = require('../models/Order');
const auth = require('../middleware/auth');
const getPaymentInfo = require('../config/payment');

const router = express.Router();

// Public: the bank/Opay details shown at checkout.
router.get('/payment-info', (req, res) => res.json(getPaymentInfo()));

// Public: place an order. No payment gateway — this just records the order and
// hands back your bank/Opay details plus a WhatsApp link for the customer to
// send proof of payment. You mark it "paid" yourself once the transfer lands.
router.post('/checkout', rateLimit({ windowMs: 10 * 60 * 1000, max: 20 }), async (req, res) => {
  const { name, phone, address, items } = req.body || {};
  const bad = ![name, phone, address].every(v => typeof v === 'string' && v.trim()) ||
    !Array.isArray(items) || !items.length || items.length > 30;
  if (bad) return res.status(400).json({ error: 'Please fill in your name, phone and address, and add items to your cart' });

  const prods = await Product.find({ _id: { $in: items.map(i => i.id).filter(mongoose.isValidObjectId) }, inStock: true });
  const lines = [];
  for (const i of items) {
    const p = prods.find(x => x.id === i.id), qty = Math.floor(+i.qty);
    if (!p || !(qty >= 1 && qty <= 20)) return res.status(400).json({ error: 'An item in your cart is no longer available' });
    lines.push({ product: p._id, name: p.name, price: p.price, qty }); // price always comes from the database
  }

  const amount = lines.reduce((s, l) => s + l.price * l.qty, 0);
  if (!(amount > 0)) return res.status(400).json({ error: 'Invalid order total' });

  const reference = 'BS-' + crypto.randomBytes(4).toString('hex').toUpperCase();
  await Order.create({ reference, amount, items: lines, customer: { name: name.trim(), phone: phone.trim(), address: address.trim() } });

  res.status(201).json({ reference, amount, whatsapp: process.env.WHATSAPP_NUMBER, payment: getPaymentInfo() });
});

// Admin: see every order.
router.get('/admin/orders', auth, async (req, res) =>
  res.json(await Order.find().sort('-createdAt').limit(100).select('-__v')));

// Admin: mark an order paid or cancelled.
router.patch('/admin/orders/:id/status', auth, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.sendStatus(404);
  const status = req.body?.status;
  if (!['pending', 'paid', 'cancelled'].includes(status)) return res.status(400).json({ error: 'Invalid status' });

  const o = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!o) return res.sendStatus(404);
  res.json(o);
});

module.exports = router;
