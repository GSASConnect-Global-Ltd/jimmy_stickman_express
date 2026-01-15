import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  userId: String,
  email: String,

  items: [
    {
      productId: String,
      name: String,
      price: Number,
      quantity: Number,
      image: String,
    }
  ],

  amount: Number,
  amountInKobo: Number,

  status: {
    type: String,
    enum: [
      "pending",
      "paid",
      "processing",
      "shipped",
      "in_transit",
      "delivered",
      "cancelled"
    ],
    default: "pending",
  },

  tracking: {
    trackingNumber: String,
    courier: String, // DHL, FedEx, GIG, etc
    trackingUrl: String,
    shippedAt: Date,
    deliveredAt: Date,
    history: [
      {
        status: String,
        message: String,
        date: { type: Date, default: Date.now },
      }
    ]
  },

  virtualAccount: {
    bank: String,
    accountName: String,
    accountNumber: String,
    bankId: Number,
    customerId: Number,
  },

  paymentReference: String,
  createdAt: { type: Date, default: Date.now }
});


export default mongoose.model("Order", orderSchema);
