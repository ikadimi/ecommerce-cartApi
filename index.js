const express = require('express');
const mongoose = require('mongoose');
const Cart = require('./models/cart.model');

const app = express();
const PORT = 3002;

// Middleware to parse JSON bodies
app.use(express.json());

// Connect to MongoDB
const url = 'mongodb://localhost:27017';
const dbName = 'ecommerce';
mongoose.connect(`${url}/${dbName}`)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));



// Add or update an item in the cart
app.post('/add', async (req, res) => {
    console.log({...req})
    if (!req || !req.body) {
        return res.status(400).send('body is empty');
    }
    const { userId, productId, quantity } = req.body;

    if (!userId || !productId || !quantity) {
        return res.status(400).send('All fields are required');
    }

    try {
        let cart = await Cart.findOne({ userId });

        if (cart) {
            // Check if the product is already in the cart
            const itemIndex = cart.items.findIndex(item => item.productId === productId);

            if (itemIndex > -1) {
                // Update quantity if product exists in the cart
                cart.items[itemIndex].quantity += quantity;
            } else {
                // Add new product to the cart
                cart.items.push({ productId, quantity });
            }
        } else {
            // Create a new cart if not exists
            cart = new Cart({
                userId,
                items: [{ productId, quantity }]
            });
        }

        await cart.save();
        res.status(200).send(cart);
    } catch (error) {
        res.status(500).send('Server error');
    }
});

// Modify the quantity of a product in the cart
app.put('/update', async (req, res) => {
    const { userId, productId, quantity } = req.body;

    if (!userId || !productId || !quantity) {
        return res.status(400).send('All fields are required');
    }

    try {
        let cart = await Cart.findOne({ userId });

        if (cart) {
            const itemIndex = cart.items.findIndex(item => item.productId === productId);

            if (itemIndex > -1) {
                // Update the quantity of the item
                cart.items[itemIndex].quantity = quantity;
                await cart.save();
                return res.status(200).send(cart);
            } else {
                return res.status(404).send('Product not found in cart');
            }
        } else {
            return res.status(404).send('Cart not found');
        }
    } catch (error) {
        res.status(500).send('Server error');
    }
});

// Remove an item from the cart
app.delete('/remove', async (req, res) => {
    const { userId, productId } = req.body;

    if (!userId || !productId) {
        return res.status(400).send('All fields are required');
    }

    try {
        let cart = await Cart.findOne({ userId });

        if (cart) {
            cart.items = cart.items.filter(item => item.productId !== productId);

            await cart.save();
            res.status(200).send(cart);
        } else {
            return res.status(404).send('Cart not found');
        }
    } catch (error) {
        res.status(500).send('Server error');
    }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
