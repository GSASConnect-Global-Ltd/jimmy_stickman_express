import axios from "axios";
import Order from "../models/Order.js";
import crypto from "crypto";

/* ===========================
   START CHECKOUT
=========================== */
export const startCheckout = async (req, res) => {
  try {
    const { userId, email, items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Items are required" });
    }

    const amount = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const amountInKobo = Math.round(amount * 100);

    const order = await Order.create({
      userId,
      email,
      items,
      amount,
      amountInKobo,
      status: "pending",
      tracking: {
        history: [
          {
            status: "pending",
            message: "Order created",
          },
        ],
      },
    });

    // ✅ DEV PAYMENT BYPASS
    // if (process.env.DEV_PAYMENT_MODE === "true") {
    //   order.status = "paid";
    //   order.paymentReference = "DEV-PAYMENT";

    //   order.tracking.history.push({
    //     status: "paid",
    //     message: "Payment simulated (DEV MODE)",
    //   });

    //   await order.save();

    //   return res.json({
    //     message: "Checkout completed (DEV MODE)",
    //     orderId: order._id,
    //     amount: order.amount,
    //     devMode: true,
    //   });
    // }

    if (process.env.DEV_PAYMENT_MODE === "true") {
  order.status = "paid";
  order.paymentReference = "DEV-PAYMENT";

  order.tracking.history.push({
    status: "paid",
    message: "Payment simulated (DEV MODE)",
  });

  await order.save();

  return res.json({
    message: "Checkout completed (DEV MODE)",
    orderId: order._id,
    amount: order.amount,
    bankDetails: {
      bank: "DEV BANK",
      accountName: "Test User",
      accountNumber: "0000000000",
  },
    devMode: true,
  });
}


    // ================= REAL PAYSTACK FLOW =================

    const customer = await axios.post(
      "https://api.paystack.co/customer",
      { email },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const account = await axios.post(
      "https://api.paystack.co/dedicated_account",
      {
        customer: customer.data.data.id,
        preferred_bank: "wema-bank",
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const vAccount = account.data.data;

    order.virtualAccount = {
      bank: vAccount.bank.name,
      accountName: vAccount.account_name,
      accountNumber: vAccount.account_number,
      bankId: vAccount.bank.id,
      customerId: vAccount.customer.id,
    };

    await order.save();

    res.json({
      message: "Checkout started",
      orderId: order._id,
      amount: order.amount,
      bankDetails: order.virtualAccount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

/* ===========================
   PAYSTACK WEBHOOK
=========================== */
export const paystackWebhook = async (req, res) => {
  try {
    const rawbody = req.body;

    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
      .update(rawbody)
      .digest("hex");

    // Optional signature check
    // if (hash !== req.headers["x-paystack-signature"]) {
    //   return res.status(401).send("Invalid signature");
    // }

    const event = JSON.parse(rawbody.toString());

    if (event.event === "charge.success") {
      const data = event.data;

      const order = await Order.findOne({
        "virtualAccount.customerId": data.customer.id,
        amountInKobo: data.amount,
      });

      if (!order) return res.sendStatus(200);

      order.status = "paid";
      order.paymentReference = data.reference;

      order.tracking.history.push({
        status: "paid",
        message: "Payment confirmed",
      });

      await order.save();
    }

    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
};

/* ===========================
   UPDATE ORDER TRACKING (ADMIN)
=========================== */
export const updateOrderTracking = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, trackingNumber, courier, trackingUrl, message } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.status = status;

    if (trackingNumber) order.tracking.trackingNumber = trackingNumber;
    if (courier) order.tracking.courier = courier;
    if (trackingUrl) order.tracking.trackingUrl = trackingUrl;

    order.tracking.history.push({ status, message });

    if (status === "shipped") order.tracking.shippedAt = new Date();
    if (status === "delivered") order.tracking.deliveredAt = new Date();

    await order.save();

    res.json({ message: "Tracking updated", order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ===========================
   MANUAL PAYMENT (ADMIN)
=========================== */
export const markOrderAsPaid = async (req, res) => {
  const order = await Order.findById(req.params.orderId);
  if (!order) return res.status(404).json({ message: "Order not found" });

  order.status = "paid";
  order.paymentReference = "MANUAL-ADMIN";

  order.tracking.history.push({
    status: "paid",
    message: "Payment manually confirmed",
  });

  await order.save();
  res.json({ message: "Order marked as paid", order });
};
