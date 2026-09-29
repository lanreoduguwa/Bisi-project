const mongoose = require('mongoose');
const { CATS } = require('../config/constants');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  category: { type: String, enum: CATS, required: true },
  price: { type: Number, required: true, min: 0 },
  description: { type: String, trim: true, maxlength: 300 },
  image: String,
  inStock: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);