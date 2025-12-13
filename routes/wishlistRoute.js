import express from "express";
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
} from "../controllers/wishlistController.js";
// import authMiddleware from "../middleware/authMiddleware.js"; // default import

const router = express.Router();

// router.use(authMiddleware); // all routes require authentication

router.get("/", getWishlist);
router.post("/add", addToWishlist);
router.post("/remove", removeFromWishlist);
router.post("/clear", clearWishlist);

export default router;
