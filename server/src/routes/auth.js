import { Router } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Center from "../models/Center.js";
import { authMiddleware } from "../middleware/auth.js";
import { signToken, setAuthCookie, clearAuthCookie } from "../utils/jwt.js";
import { ensureSubscriptionForCenter } from "../services/subscriptionService.js";

const router = Router();

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, centerName, phone, city } = req.body;

    if (!name || !email || !password || !centerName || !phone || !city) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      passwordHash,
      centerName,
      phone,
      plan: "free",
    });

    const center = await Center.create({
      ownerId: user._id,
      name: centerName,
      city,
    });

    await ensureSubscriptionForCenter(center._id, user._id);

    const token = signToken({
      userId: user._id.toString(),
      centerId: center._id.toString(),
    });
    setAuthCookie(res, token);

    res.status(201).json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        centerName: user.centerName,
        phone: user.phone,
        plan: user.plan,
        centerId: center._id.toString(),
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Server error during signup" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const center = await Center.findOne({ ownerId: user._id });
    if (!center) {
      return res
        .status(500)
        .json({ message: "Center not found for this account" });
    }

    const token = signToken({
      userId: user._id.toString(),
      centerId: center._id.toString(),
    });
    setAuthCookie(res, token);

    res.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        centerName: user.centerName,
        phone: user.phone,
        plan: user.plan,
        centerId: center._id.toString(),
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error during login" });
  }
});

router.post("/logout", (_req, res) => {
  clearAuthCookie(res);
  res.json({ message: "Logged out" });
});

router.get("/me", authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

export default router;
