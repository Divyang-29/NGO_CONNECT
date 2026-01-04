const express = require("express");
const User = require("../modules/user");
const Admin = require("../modules/admin");

const router = express.Router();

/* ================= REGISTER ================= */
router.post("/register", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ message: "All fields required" });
    }

    if (role === "user") {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      await User.create({
        name: "User",     // ✅ required by schema
        email,
        password,         // ✅ schema will hash
        phone: "",
      });
    }

    if (role === "admin") {
      const existingAdmin = await Admin.findOne({ email });
      if (existingAdmin) {
        return res.status(400).json({ message: "Admin already exists" });
      }

      await Admin.create({
        name: "Admin",    // ✅ required by schema
        email,
        password,
        phone: "",
      });
    }

    res.status(201).json({
      message: "Registered successfully",
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    res.status(500).json({ message: error.message });
  }
});

/* ================= LOGIN ================= */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    // try user first
    let account =
      (await User.findOne({ email }).select("+password")) ||
      (await Admin.findOne({ email }).select("+password"));

    if (!account) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await account.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    res.status(200).json({
      message: "Login successful",
      user: {
        id: account._id,
        email: account.email,
        role: account.constructor.modelName.toLowerCase(), // user | admin
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({ message: error.message });
  }
});

/* ================= AUTH ME ================= */
router.get("/me", (req, res) => {
  // placeholder until JWT/session
  res.status(200).json({ user: null });
});

module.exports = router;
