import express from "express";
import { updateOrderTracking } from "../controllers/paymentController.js";

const router = express.Router();

// Admin only
router.put("/:orderId/tracking", updateOrderTracking);

// User tracking
router.get("/:orderId", async (req, res) => {
  const order = await Order.findById(req.params.orderId);
  if (!order) return res.status(404).json({ message: "Order not found" });
  res.json(order);
});

export default router;
