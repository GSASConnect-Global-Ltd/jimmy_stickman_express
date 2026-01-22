import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import transporter from "../config/mailer.js";
import crypto from "crypto";

// ==========================
// REGISTER
// ==========================
export const register = async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");

    const user = await User.create({
      name,
      email,
      verificationToken,
      verificationTokenExpires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    });

    // const verifyUrl = `${process.env.FRONTEND_URL}/verify/${verificationToken}`;

    // await transporter.sendMail({
    //   to: email,
    //   subject: "Verify your account",
    //   template: "verify",
    //   context: {
    //     name,
    //     verifyUrl,
    //   },
    // });

    const verifyUrl = `${process.env.FRONTEND_URL}/verify/${verificationToken}`;

console.log("📧 Sending verification email");
console.log("👤 Name:", name);
console.log("📨 Email:", email);
console.log("🔑 Verification Token:", verificationToken);
console.log("🔗 Verify URL:", verifyUrl);

await transporter.sendMail({
  to: email,
  subject: "Verify your account",
  template: "verify",
  context: {
    name,
    verifyUrl,
    verificationToken, // ✅ PASS TOKEN TO TEMPLATE
  },
});


    res.status(201).json({
      message: "Verification email sent. Please check your inbox.",
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ==========================
// VERIFY ACCOUNT
// ==========================

export const verifyAccount = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // user.password = await bcrypt.hash(password, 10);
    // user.isVerified = true;
    // user.verificationToken = undefined;
    // user.verificationTokenExpires = undefined;

    // await user.save();

    console.log("🔍 VERIFY TOKEN:", token);

console.log("👤 User found:", user.email);
console.log("🔑 Password before save:", user.password);

user.password = await bcrypt.hash(password, 10);
user.isVerified = true;

// 🔥 IMPORTANT
user.verificationToken = undefined;
user.verificationTokenExpires = undefined;

await user.save();


console.log("✅ Password saved & account verified");


    res.json({ message: "Account verified successfully. You can now login." });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ==========================
// LOGIN
// ==========================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("🔐 LOGIN ATTEMPT:", email);

    const user = await User.findOne({ email }).select("+password"); // ✅ include password

    if (!user) {
      console.log("❌ User not found");
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.isVerified) {
      console.log("❌ Account not verified");
      return res.status(403).json({
        message: "Please verify your email before logging in",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log("🔑 Password match:", isMatch);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { _id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.cookie("jwt", token, {
      httpOnly: true,
      secure: false, // true in production HTTPS
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    console.log("✅ Login successful");

    res.json({ message: "Login successful" });
  } catch (error) {
    console.error("❌ LOGIN ERROR:", error);
    res.status(500).json({ message: "Server error" });
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



// controllers/auth.js
export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Generate token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Save token and expiry (1 hour)
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = Date.now() + 60 * 60 * 1000;
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // Send email
    await transporter.sendMail({
      to: email,
      subject: "Reset your password",
      template: "reset-password",
      context: {
        name: user.name,
        resetUrl,
      },
    });

    res.json({ message: "Password reset email sent" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params; // /reset-password/:token
    const { password } = req.body;

    if (!password) return res.status(400).json({ message: "Password is required" });

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }, // not expired
    });

    if (!user) return res.status(400).json({ message: "Invalid or expired token" });

    // Update password
    user.password = await bcrypt.hash(password, 10);

    // Clear reset fields
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    res.json({ message: "Password has been reset successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
