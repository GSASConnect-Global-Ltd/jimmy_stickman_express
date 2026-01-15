export const updateOrderTracking = async (req, res) => {
  try {
    const { orderId } = req.params;
    const {
      status,
      trackingNumber,
      courier,
      trackingUrl,
      message
    } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.status = status;

    if (trackingNumber) order.tracking.trackingNumber = trackingNumber;
    if (courier) order.tracking.courier = courier;
    if (trackingUrl) order.tracking.trackingUrl = trackingUrl;

    order.tracking.history.push({
      status,
      message,
    });

    if (status === "shipped") {
      order.tracking.shippedAt = new Date();
    }

    if (status === "delivered") {
      order.tracking.deliveredAt = new Date();
    }

    await order.save();

    res.json({ message: "Tracking updated", order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

