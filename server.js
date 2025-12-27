import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./config/db.js";

// Routes
import authRoutes from "./routes/authRoute.js";
import protectedRoutes from "./routes/protectedRoute.js";
import paymentRoutes from "./routes/paymentRoute.js";
import productRoutes from "./routes/productRoute.js";
import cartRoutes from "./routes/cartRoute.js";
import wishlistRoutes from "./routes/wishlistRoute.js";

dotenv.config();

// ---------------- APP INIT (MUST COME FIRST) ----------------
const app = express();

// ---------------- REQUEST LOGGER ----------------
app.use((req, res, next) => {
  console.log("➡️ Incoming request:", {
    method: req.method,
    url: req.originalUrl,
    body: req.body,
    cookies: req.cookies,
  });
  next();
});

// ---------------- CORS ----------------
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map(o => o.trim())
  : [];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn("❌ Blocked by CORS:", origin);
        callback(null, false); // ❗ DO NOT throw Error
      }
    },
    credentials: true,
  })
);

// ---------------- MIDDLEWARE ----------------
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------------- STATIC ----------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ---------------- ROUTES ----------------
app.get("/", (req, res) => {
  res.send("API is running...");
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api", protectedRoutes);


// ---------------- GLOBAL ERROR HANDLER ----------------
app.use((err, req, res, next) => {
  console.error("❌ GLOBAL ERROR");
  console.error("Route:", req.method, req.originalUrl);
  console.error("Message:", err.message);
  console.error(err.stack);

  res.status(err.status || 500).json({
    message: err.message || "Something went wrong",
  });
});

// ---------------- DB & SERVER ----------------
connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);
