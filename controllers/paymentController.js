import axios from "axios";
import Order from "../models/Order.js";
import crypto from "crypto";

export const startCheckout = async (req, res) => {
  try {
    const { userId, email, items } = req.body;

    // Calculate total
    const amount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Create order
    const order = await Order.create({
      userId,
      email,
      items,
      amount,
      status: "pending"
    });

    // Create Paystack customer
    const customer = await axios.post(
      "https://api.paystack.co/customer",
      { email },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    // Create virtual bank account
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

    // Save details in order
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
    console.log(error.response?.data);
    res.status(500).json({ error: error.message });
  }
};




export const paystackWebhook = async (req, res) => {
  try {
    const rawbody = req.body; // this is a Buffer because of express.raw()
    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
      .update(rawbody)
      .digest("hex");

    // if (hash !== req.headers["x-paystack-signature"]) {
    //   console.log("SIGNATURE MISMATCH");
    //   return res.status(401).send("Invalid signature");
    // }

    const event = JSON.parse(rawbody.toString()); // parse the raw JSON here

    if (event.event === "charge.success") {
      const data = event.data;
      const amountPaid = data.amount / 100;

      // Find matching order
      const order = await Order.findOne({
        "virtualAccount.customerId": data.customer.id,
        amount: amountPaid,
      });

      if (order) {
        order.status = "paid";
        order.paymentReference = data.reference;
        await order.save();
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
};
