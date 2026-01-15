import express from "express";
import {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  trackOrder,
} from "../controllers/orderController.js";

const router = express.Router();

/* ========= ADMIN ROUTES ========= */
router.get("/orders", getAllOrders);
router.get("/orders/:orderId", getOrderById);
router.put("/orders/:orderId", updateOrderStatus);
router.delete("/orders/:orderId", cancelOrder);

/* ========= CLIENT TRACKING ========= */
router.get("/track/:orderId", trackOrder);

export default router;
