const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const cartItemSchema = new Schema({
  userId: { type: String, required: true }, // Identifies the user
  items: [
    {
      productId: { type: String, required: true },
      quantity: { type: Number, required: true, min: 1 },
      price: { type: Number, required: true }, // Optional, can be fetched from product service
    }
  ]
});

module.exports = mongoose.model('Cart', cartItemSchema);