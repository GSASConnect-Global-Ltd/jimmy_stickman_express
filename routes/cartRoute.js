import express from "express";
import {
  addItemToCart,
  getCartItems,
  removeFromCart,
  clearCart,
} from "../controllers/cartController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware); // all routes require authentication

router.post("/add", addItemToCart);
router.get("/", getCartItems);
router.post("/remove", removeFromCart);
router.post("/clear", clearCart);

export default router;
