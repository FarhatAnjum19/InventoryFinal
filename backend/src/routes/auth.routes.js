const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const LOGIN_ONLY_USER = String(process.env.LOGIN_ONLY_USER || "").trim();
const LOGIN_ONLY_PASSWORD = String(process.env.LOGIN_ONLY_PASSWORD || "");

function createToken(userId) {
  return jwt.sign({ sub: String(userId) }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
}

router.post("/login", async (req, res) => {
  try {
    const { name, password } = req.body || {};
    console.log("POST /api/auth/login body:", { name: name && String(name).slice(0, 50), password: password ? "<redacted>" : "" });
    const inputName = String(name || "").trim();

    if (!inputName || !password) {
      return res.status(400).json({ success: false, message: "name and password are required" });
    }

    const inputNameLower = inputName.toLowerCase();
    const allowedNameLower = String(LOGIN_ONLY_USER || "").toLowerCase();

    if (inputNameLower !== allowedNameLower) {
      console.warn(`Login attempt with unknown username: ${inputName}`);
      return res.status(401).json({ success: false, message: "Invalid username" });
    }

    if (password !== LOGIN_ONLY_PASSWORD) {
      console.warn(`Login attempt with wrong password for user: ${inputName}`);
      return res.status(401).json({ success: false, message: "Invalid password" });
    }

    // find user by name case-insensitively
    let user = await User.findOne({ name: new RegExp(`^${LOGIN_ONLY_USER}$`, "i") });
    if (!user) {
      const passwordHash = await bcrypt.hash(LOGIN_ONLY_PASSWORD, 10);
      user = await User.create({ name: LOGIN_ONLY_USER, passwordHash });
    } else {
      const matched = await bcrypt.compare(LOGIN_ONLY_PASSWORD, user.passwordHash);
      if (!matched) {
        user.passwordHash = await bcrypt.hash(LOGIN_ONLY_PASSWORD, 10);
        await user.save();
      }
    }

    const token = createToken(user._id);

    return res.json({
      success: true,
      message: "Login successful",
      data: { id: user._id, name: user.name, token },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ success: false, message: "Login failed", error: error.message });
  }
});

module.exports = router;
