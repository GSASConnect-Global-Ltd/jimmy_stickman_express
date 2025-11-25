// routes/adminRoute.js
import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

// Example admin-only route
router.get("/dashboard", authMiddleware, adminMiddleware, (req, res) => {
  res.json({
    message: "Welcome to the admin dashboard 🚀",
    adminId: req.user,
  });
});

export default router;
