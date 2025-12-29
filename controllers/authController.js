import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

// ==========================
// REGISTER
// ==========================
export const register = async (req, res) => {
  try {
    console.log("🟢 REGISTER BODY:", req.body);

    const { name, email, password, role } = req.body;

    if (!email || !password) {
      console.error("🔴 Missing fields");
      return res.status(400).json({ message: "Missing fields" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.error("🔴 User already exists:", email);
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "user"
    });

    const { password: pw, ...userData } = user.toObject();
    console.log("✅ User created:", userData.email);

    res.status(201).json(userData);

  } catch (error) {
    console.error("❌ REGISTER ERROR:", error);
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
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid password" });

    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET || "secretKey");

    res.cookie("jwt", token, {
      httpOnly: true,
      secure: false,  // set true in production HTTPS
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    res.json({ message: "Login successful" });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==========================
// GET USER (protected)
// ==========================
export const getUser = async (req, res) => { 
  try {
    const token = req.cookies.jwt;
    if (!token) return res.status(401).json({ message: "Unauthenticated" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretKey");
    const user = await User.findById(decoded._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { password, ...userData } = user.toObject();
    res.json(userData);

  } catch (error) {
    res.status(401).json({ message: "Unauthenticated", error: error.message });
  }
};

// ==========================
// LOGOUT
// ==========================
export const logout = (req, res) => {
  res.cookie("jwt", "", { maxAge: 0, httpOnly: true, sameSite: "lax" });
  res.json({ message: "Logout successful" });
};
