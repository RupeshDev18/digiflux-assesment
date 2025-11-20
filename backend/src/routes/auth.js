const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const router = express.Router();

router.get("/google", (req, res, next) => {
  const redirect = req.query.redirect || "/";

  passport.authenticate("google", {
    scope: ["profile", "email"],
    state: redirect,
  })(req, res, next);
});

router.get("/me", async (req, res) => {
  try {
    console.log("User:", req.user);

    if (!req.user) {
      console.log("No user in session");
      return res.status(401).json({ message: "Not authenticated" });
    }

    console.log("User authenticated:", req.user.email);
    res.json({
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    });
  } catch (error) {
    console.error("error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: process.env.FRONTEND_URL + "/login?error=auth_failed",
    session: true,
  }),
  (req, res) => {
    try {
      console.log("User after auth:", req.user);

      const frontendURL = process.env.FRONTEND_URL || "http://localhost:3000";
      res.redirect(`${frontendURL}/`);
    } catch (error) {
      console.error("Google callback error:", error);
      res.redirect(process.env.FRONTEND_URL + "/login?error=server_error");
    }
  }
);

router.post("/logout", (req, res) => {
  req.logout(() => {
    res.json({ message: "Logged out successfully" });
  });
});

module.exports = router;
