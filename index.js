const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const cors = require('cors');
const Cart = require('./models/cart.model');
const createResponse = require('./models/response.model');

const app = express();
const PORT = 3002;
const PRODUCT_API_URL = 'http://localhost:3000';

// Middleware to parse JSON bodies
app.use(express.json());

// Middleware to allow cross-origin requests
app.use((req, res, next) => {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
	next();
  });
app.use(cors({
  credentials: true,
  origin: 'http://localhost:4200'
}));

// Connect to MongoDB
const url = 'mongodb://localhost:27017';
const dbName = 'ecommerce';
mongoose.connect(`${url}/${dbName}`)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Get all items in the cart
app.get('/', async (req, res) => {
    const userId = req.headers['x-user-id'];
    if (!userId) {
        return res.status(400).send({ message: 'User ID is required' });
    }

    try {
        const cart = await Cart.findOne({ userId });
        res.status(200).send(cart);
    } catch (error) {
        res.status(500).send({ message: 'Server error' });
    }   
});

// Add or update an item in the cart
app.post('/add', async (req, res) => {
    if (!req || !req.body) {
        return res.status(400).send({ message: 'body is empty' });
    }

    const userId = req.headers['x-user-id'];
    const { productId, quantity } = req.body;

    if (!userId || !productId || !quantity) {
        return res.status(400).send({ message: 'All fields are required' });
    }

    try {
        // Fetch product details from catalog microservice
        console.log('fetching product', productId)
        const productResponse = await axios.get(`${PRODUCT_API_URL}/products/${productId}`);
        const product = productResponse.data;

        console.log(product)
        if (!product) {
            return res.status(404).send({ message: 'Product not found' });
        }

        let cart = await Cart.findOne({ userId });

        if (cart) {
            // Check if the product is already in the cart
            const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);

            if (itemIndex > -1) {
                // Update quantity if product exists in the cart
                cart.items[itemIndex].quantity += quantity;
            } else {
                // Add new product to the cart
                cart.items.push({
                    productId,
                    quantity,
                    price: product.price // Store the product price at the time of adding to cart
                });
            }
        } else {
            // Create a new cart if not exists
            cart = new Cart({
                userId,
                items: [{
                    productId,
                    quantity,
                    price: product.price // Store the product price
                }]
            });
        }

        console.log('cart created', cart)

        // Calculate total price
        cart.totalPrice = cart.items.reduce((total, item) => total + item.price * item.quantity, 0);

        console.log('total price', cart)


        await cart.save();
        console.log('cart saved')
        res.status(200).send(createResponse(true, 'Item added successfully', cart));
    } catch (error) {
        console.log(error)
        res.status(500).send({ message: 'Server error' });
    }
});


// Modify the quantity of a product in the cart
app.put('/update', async (req, res) => {
    const userId = req.headers['x-user-id'];
    const { productId, quantity } = req.body;

    if (!userId || !productId || !quantity) {
        return res.status(400).send({ message: 'All fields are required' });
    }

    try {
        let cart = await Cart.findOne({ userId });

        if (cart) {
            const itemIndex = cart.items.findIndex(item => item.productId === productId);

            if (itemIndex > -1) {
                // Update the quantity of the item
                cart.items[itemIndex].quantity = quantity;
                await cart.save();
                return res.status(200).send(createResponse(true, 'Quantity updated successfully', cart));
            } else {
                return res.status(404).send({ message: 'Product not found in cart' });
            }
        } else {
            return res.status(404).send({ message: 'Cart not found' });
        }
    } catch (error) {
        res.status(500).send({ message: 'Server error' });
    }
});

// Remove an item from the cart
app.delete('/remove', async (req, res) => {
    const userId = req.headers['x-user-id'];
    const { productId } = req.query;

    console.log(userId, productId, {...req})
    if (!userId || !productId) {
        return res.status(400).send({ message: 'All fields are required' })
    }

    try {
        let cart = await Cart.findOne({ userId });

        if (cart) {
            cart.items = cart.items.filter(item => item.productId !== productId);

            await cart.save();
            res.status(200).send(createResponse(true, 'Item removed successfully', cart));
        } else {
            return res.status(404).send({ message: 'Cart not found' });
        }
    } catch (error) {
        res.status(500).send({ message: 'Server error' });
    }
});

app.delete('/clear', async (req, res) => {
    const userId = req.headers['x-user-id'];
    if (!userId) {
        return res.status(400).send({ message: 'User not found' })
    }    
    try { 
        const cart = await Cart.findOneAndDelete({ userId });
        res.status(200).send(createResponse(true, 'Cart cleared successfully', cart));
    } catch (error) {
        res.status(500).send({ message: 'Server error' });
    }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
