// controllers/wishlistController.js
import Wishlist from "../models/Wishlist.js";
import Product from "../models/Product.js";

// -------------------- GET USER WISHLIST --------------------
export const getWishlist = async (req, res) => {
  try {
    const userId = req.user.id; // assuming req.user from auth middleware

    let wishlist = await Wishlist.findOne({ user: userId }).populate(
      "products.product"
    );

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: userId, products: [] });
    }

    res.json({ wishlist });
  } catch (error) {
    console.error("Error fetching wishlist:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- ADD TO WISHLIST --------------------
export const addToWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, variant } = req.body;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    let wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
      wishlist = await Wishlist.create({ user: userId, products: [] });
    }

    // Avoid duplicates (same product + variant)
    const exists = wishlist.products.some(
      (p) =>
        p.product.toString() === productId &&
        JSON.stringify(p.variant) === JSON.stringify(variant || {})
    );

    if (exists)
      return res.status(400).json({ message: "Product already in wishlist" });

    wishlist.products.push({ product: productId, variant });
    await wishlist.save();

    res.json({ message: "Product added to wishlist", wishlist });
  } catch (error) {
    console.error("Add to wishlist error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- REMOVE FROM WISHLIST --------------------
export const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, variant } = req.body;

    const wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) return res.status(404).json({ message: "Wishlist not found" });

    wishlist.products = wishlist.products.filter(
      (p) =>
        !(
          p.product.toString() === productId &&
          JSON.stringify(p.variant) === JSON.stringify(variant || {})
        )
    );

    await wishlist.save();
    res.json({ message: "Product removed from wishlist", wishlist });
  } catch (error) {
    console.error("Remove from wishlist error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- CLEAR WISHLIST --------------------
export const clearWishlist = async (req, res) => {
  try {
    const userId = req.user.id;

    const wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) return res.status(404).json({ message: "Wishlist not found" });

    wishlist.products = [];
    await wishlist.save();

    res.json({ message: "Wishlist cleared", wishlist });
  } catch (error) {
    console.error("Clear wishlist error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
