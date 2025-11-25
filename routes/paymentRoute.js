import express from "express";
import { startCheckout, paystackWebhook } from "../controllers/paymentController.js";

const router = express.Router();

router.post("/checkout", startCheckout);
router.post("/webhook", express.raw({ type: "application/json" }), paystackWebhook);

export default router;
