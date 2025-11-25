import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

// -------------------- ADD ITEM TO CART --------------------
export const addItemToCart = async (req, res) => {
    try{
        const userId = req.user;
        const { productId, quantity } = req.body;

        // Check if product exists
        const product = await Product.findById(productId);
        if(!product) return res.status(404).json({message: "Product not found"});

        // Find user's cart or create a new one
        let cart = await Cart.findOne({user: userId});
        if(!cart){
            cart = new Cart({user: userId, items:[]});
        }

        // Check if product is already in cart
        const cartItemIndex = cart.items.findIndex(item => item.product.toString() === productId);

        if(cartItemIndex > -1){
            // Product exists in cart, update quantity
            cart.items[cartItemIndex].quantity += quantity;
        }
        else{
            // Product does not exist in cart, add new item
            cart.items.push({product: productId, quantity});

        }

        await cart.save();
        res.status(200).json({message: "Item added to cart", cart});
    }

    catch(error){
        console.error("Error adding item to cart:", error.message);
        res.status(500).json({message: "Server error", error: error.message});
}

}

// -------------------- GET CART ITEMS --------------------
export const getCartItems = async (req, res) => {
    try{
        const userId = req.user;
        const cart = await Cart.findOne({user: userId}).populate('items.product');

        if(!cart) return res.json({items: []});
        res.json(cart);
    }
    catch(error){
        console.error("Error fetching cart items:", error.message);
        res.status(500).json({message: "Server error", error: error.message});
    }
}

// Remove item from cart
export const removeFromCart = async (req, res) => {
  try {
    const userId = req.user;
    const { productId } = req.body;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = cart.items.filter((item) => item.product.toString() !== productId);

    await cart.save();
    res.json({ message: "Product removed from cart", cart });
  } catch (error) {
    console.error("Remove from cart error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Clear cart
export const clearCart = async (req, res) => {
  try {
    const userId = req.user;
    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = [];
    await cart.save();
    res.json({ message: "Cart cleared", cart });
  } catch (error) {
    console.error("Clear cart error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

