const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [
    {
      productId: { type: String, ref: 'Product', required: true },
      name: { type: String, required: true },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true } // Store price of the product at the time of adding to cart
    }
  ],
  totalPrice: { type: Number, required: true }, // Store the total price
  createdAt: { type: Date, default: Date.now }
});

// Method to calculate total price
// cartSchema.methods.calculateTotalPrice = function () {
//   this.totalPrice = this.items.reduce((total, item) => {
//     return total + item.price * item.quantity;
//   }, 0);
// };

module.exports = mongoose.model('Cart', cartSchema);
