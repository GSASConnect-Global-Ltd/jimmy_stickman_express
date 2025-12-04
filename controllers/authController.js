//C:\express\osmium_blog_backend\osmium_blog_express_application\controllers\authController.js

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Helper: Generate Access Token
const generateAccessToken = (userId) => {
  console.log("Signing token with JWT_SECRET:", JSON.stringify(process.env.JWT_SECRET));

  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "30m" });
};

// Helper: Generate Refresh Token
const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
};

// @desc    Register User
// @route   POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({ name, email, password: hashedPassword, role: role || "user" });

    res.status(201).json({ message: "User registered successfully", user: { id: user._id, name, email, role } });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Login User
// @route   POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    console.log(`✅ User ${user.email} logged in`);

    // -----------------------------
    //  SET ACCESS TOKEN (HTTP-ONLY)
    // -----------------------------
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      // secure: process.env.NODE_ENV === "production",
      secure: false,
      sameSite: "Lax",        // important for cross-domain Next.js local frontend
      maxAge: 30 * 60 * 1000,  // 30 minutes
    });

    // -----------------------------
    //  SET REFRESH TOKEN (HTTP-ONLY)
    // -----------------------------
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      // secure: process.env.NODE_ENV === "production",
      secure: false,
      sameSite: "Lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });




    // debug

    console.log("===== DEBUG: LOGIN ROUTE =====");
console.log("Incoming email:", email);
console.log("User found:", !!user);
console.log("AccessToken preview:", accessToken.substring(0, 20) + "...");
console.log("RefreshToken preview:", refreshToken.substring(0, 20) + "...");

console.log("Setting cookies:");
console.log("accessToken cookie:", {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "None",
  maxAge: 30 * 60 * 1000,
});
console.log("refreshToken cookie:", {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "None",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

res.on("finish", () => {
  console.log("🚀 DEBUG: Response delivered to FE");
  console.log("===============================");
});


    // -----------------------------
    //  SEND RESPONSE
    // -----------------------------




//     res.json({
//       message: "Login successful",
//       accessToken, // optional, for debugging
//     });

//     console.log("TOKEN SENT TO FRONTEND:", token);
// return res.json({
//   message: "Login successful",
//   token,
// });

res.json({
  message: "Login successful",
  token: accessToken,  // rename so frontend matches
});

// debug
console.log("TOKEN SENT TO FRONTEND:", accessToken);



  } catch (error) {
    console.error("❌ Login error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



// @desc    Refresh Access Token
// @route   POST /api/auth/refresh
export const refresh = (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    console.warn("⚠️ No refresh token provided");
    return res.status(401).json({ message: "No refresh token provided" });
  }

  jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
    if (err) {
      console.warn("❌ Invalid or expired refresh token");
      return res.status(403).json({ message: "Invalid or expired refresh token" });
    }

    const newAccessToken = generateAccessToken(decoded.id);
    console.log(`🔄 Refresh token valid. New access token issued for userId=${decoded.id}`);
    res.json({ accessToken: newAccessToken });
  });
};


// @desc    Logout User
// @route   POST /api/auth/logout
export const logout = (req, res) => {
  console.log("👋 User logged out, clearing refresh token cookie");
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict"
  });
  res.json({ message: "Logged out successfully" });
};
