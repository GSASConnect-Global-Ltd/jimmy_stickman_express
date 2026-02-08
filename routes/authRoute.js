import express from "express";
import { register, login, getUser, logout, verifyAccount, requestPasswordReset, resetPassword } from "../controllers/authController.js";

console.log("✅ authRoute loaded");

const router = express.Router();

router.use((req, res, next) => {
  console.log("🔐 AUTH ROUTE HIT:", req.method, req.originalUrl);
  next();
});

router.post("/register", register);
router.post("/login", login);
router.get("/user", getUser);
router.post("/logout", logout);
router.post("/verify/:token", verifyAccount);

router.post("/forgot-password", requestPasswordReset);

// Reset password
router.post("/reset-password/:token", resetPassword);
router.get("/test", (req, res) => {
  console.log("🧪 AUTH TEST ROUTE HIT");
  console.log("Headers:", req.headers);
  console.log("Cookies:", req.cookies);

  


  res.json({
    message: "Auth test route working",
    time: new Date().toISOString(),
  });
});

export default router;
