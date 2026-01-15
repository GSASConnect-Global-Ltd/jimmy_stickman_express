import express from "express";
import { startCheckout, paystackWebhook ,  markOrderAsPaid} from "../controllers/paymentController.js";

const router = express.Router();

router.post("/checkout", startCheckout);
router.post("/webhook", express.raw({ type: "application/json" }), paystackWebhook);
router.put("/orders/:orderId/pay", markOrderAsPaid);


export default router;
