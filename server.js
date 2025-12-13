import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import { createMail } from "./services/mailServices.js";

import connectDB from "./config/db.js";

// Routes
import authRoutes from "./routes/authRoute.js";
import protectedRoutes from "./routes/protectedRoute.js";
import paymentRoutes from "./routes/paymentRoute.js";
import productRoutes from "./routes/productRoute.js";
import adminRoutes from "./routes/adminRoute.js";
import cartRoutes from "./routes/cartRoute.js";
import wishlistRoutes from "./routes/wishlistRoute.js";

dotenv.config();

// Connect to MongoDB
connectDB();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();



// CORS

const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map(origin => origin.trim())
  : [];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Cookies
app.use(cookieParser());

// Static folder for uploads (CVs, documents, images)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Payment routes
app.use("/api/payments", paymentRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// ------------------- EMAIL TEST ROUTE -------------------
app.post("/api/test-mail", async (req, res) => {
  try {
    const mail = await createMail({
      email: req.body.email || "oluwatosinissa2000@gmail.com", // fallback email
      subject: "🚀 Test Mail from Express + Mailtrap",
      template: "welcome", // must exist in /views/email/welcome.hbs
      context: {
        username: "Yusuf",
        appName: "Osmium Blog",
      },
      text: "This is a plain text test email.",
    });

    res.json({ message: "✅ Mail processed", mail });
  } catch (err) {
    console.error("❌ Mail test error:", err.message);
    res.status(500).json({ error: "Failed to send mail" });
  }
});
// --------------------------------------------------------

// Routes
app.use("/api/auth", authRoutes);


app.use("/api/products", productRoutes);

// Protected routes
app.use("/api", protectedRoutes);

// Admin routes
app.use("/api/admin", adminRoutes);

// Cart routes
app.use("/api/cart", cartRoutes);

//wishlist routes
app.use("/api/wishlist", wishlistRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error("❌ Global error:", err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
