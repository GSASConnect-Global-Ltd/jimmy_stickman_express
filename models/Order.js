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

  status: {
    type: String,
    default: "pending", // pending | paid | cancelled
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
