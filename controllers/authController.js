// C:\express\osmium_blog_backend\osmium_blog_express_application\controllers\authController.js

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Generate Access Token
const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "30m" });
};

// Generate Refresh Token
const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
};

// ==========================
// REGISTER
// ==========================
export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "user"
    });

    res.status(201).json({
      message: "User registered successfully",
      user: { id: user._id, name, email, role }
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==========================
// LOGIN
// ==========================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    console.log(`✅ User logged in: ${email}`);

    // Correct cookie settings for localhost
    const cookieOptions = {
  httpOnly: true,
  secure: false,        // true only in production HTTPS
  sameSite: "lax",
  path: "/",
};

res.cookie("access_token", accessToken, {
  ...cookieOptions,
  maxAge: 30 * 60 * 1000,
});

res.cookie("refresh_token", refreshToken, {
  ...cookieOptions,
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

res.json({ message: "Login successful" });


  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==========================
// REFRESH TOKEN
// ==========================
export const refresh = (req, res) => {
  const refreshToken = req.cookies.refresh_token; // ✅ FIXED

  if (!refreshToken) {
    return res.status(401).json({ message: "No refresh token provided" });
  }

  jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired refresh token" });
    }

    const newAccessToken = generateAccessToken(decoded.id);

    // OPTIONAL but recommended: set new access token cookie
    res.cookie("access_token", newAccessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 60 * 1000,
    });

    return res.json({ message: "Token refreshed" });
  });
};


// ==========================
// LOGOUT
// ==========================
export const logout = (req, res) => {
  const cookieOptions = {
    httpOnly: true,
    secure: false,     // same as login
    sameSite: "Lax",
    path: "/",         // 🔥 FIXED — this was missing!
  };

  res.clearCookie("access_token", cookieOptions);
  res.clearCookie("refresh_token", cookieOptions);

  return res.json({ message: "Logged out successfully" });
};

