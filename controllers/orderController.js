import Order from "../models/Order.js";

/* ===========================
   GET ALL ORDERS (ADMIN)
=========================== */
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json({ count: orders.length, orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ===========================
   GET SINGLE ORDER (ADMIN)
=========================== */
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order)
      return res.status(404).json({ message: "Order not found" });

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ===========================
   UPDATE ORDER STATUS (ADMIN)
=========================== */
export const updateOrderStatus = async (req, res) => {
  try {
    const { status, message, courier, trackingNumber, trackingUrl } = req.body;

    const order = await Order.findById(req.params.orderId);
    if (!order)
      return res.status(404).json({ message: "Order not found" });

    order.status = status;

    if (courier) order.tracking.courier = courier;
    if (trackingNumber) order.tracking.trackingNumber = trackingNumber;
    if (trackingUrl) order.tracking.trackingUrl = trackingUrl;

    order.tracking.history.push({
      status,
      message: message || `Order is now ${status}`,
    });

    if (status === "shipped") order.tracking.shippedAt = new Date();
    if (status === "delivered") order.tracking.deliveredAt = new Date();

    await order.save();
    res.json({ message: "Order updated", order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ===========================
   CANCEL ORDER (ADMIN)
=========================== */
export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order)
      return res.status(404).json({ message: "Order not found" });

    order.status = "cancelled";
    order.tracking.history.push({
      status: "cancelled",
      message: "Order cancelled by admin",
    });

    await order.save();
    res.json({ message: "Order cancelled", order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ===========================
   CLIENT TRACK ORDER (PUBLIC)
=========================== */
export const trackOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId).select(
      "status tracking items amount createdAt"
    );

    if (!order)
      return res.status(404).json({ message: "Order not found" });

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
