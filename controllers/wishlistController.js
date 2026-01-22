// controllers/wishlistController.js
import Wishlist from "../models/Wishlist.js";
import Product from "../models/Product.js";

export const getWishlist = async (req, res) => {
  const userId = req.user._id;

  let wishlist = await Wishlist.findOne({ user: userId })
    .populate("products.product");

  if (!wishlist) {
    wishlist = await Wishlist.create({ user: userId, products: [] });
  }

  res.json(wishlist);
};

export const addToWishlist = async (req, res) => {
  const userId = req.user._id;
  const { productId, variant } = req.body;

  let wishlist = await Wishlist.findOne({ user: userId });
  if (!wishlist) wishlist = await Wishlist.create({ user: userId, products: [] });

  const exists = wishlist.products.some(
    (p) =>
      p.product.toString() === productId &&
      JSON.stringify(p.variant || {}) === JSON.stringify(variant || {})
  );

  if (exists) {
    return res.status(400).json({ message: "Already in wishlist" });
  }

  wishlist.products.push({ product: productId, variant });
  await wishlist.save();

  res.json(wishlist);
};

export const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId, variant } = req.body;

    const wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
      return res.status(404).json({ message: "Wishlist not found" });
    }

    wishlist.products = wishlist.products.filter(
      (p) =>
        !(
          p.product.toString() === productId &&
          JSON.stringify(p.variant || {}) === JSON.stringify(variant || {})
        )
    );

    await wishlist.save();

    // IMPORTANT: repopulate
    await wishlist.populate("products.product");

    res.json(wishlist);
  } catch (error) {
    console.error("❌ removeFromWishlist error:", error);
    res.status(500).json({ message: "Server error" });
  }
};



// -------------------- CLEAR WISHLIST --------------------
export const clearWishlist = async (req, res) => {
  try {
    const userId = req.user._id;

    const wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
      return res.status(404).json({ message: "Wishlist not found" });
    }

    wishlist.products = [];
    await wishlist.save();

    res.json(wishlist);
  } catch (error) {
    console.error("❌ clearWishlist error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
