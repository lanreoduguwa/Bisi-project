const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  reference: { type: String, unique: true },
  customer: { name: String, phone: String, address: String },
  items: [{ product: mongoose.Schema.Types.ObjectId, name: String, price: Number, qty: Number }],
  amount: Number,
  status: { type: String, enum: ['pending', 'paid', 'cancelled'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);