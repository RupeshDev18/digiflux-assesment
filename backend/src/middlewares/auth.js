const User = require("../models/User");

const auth = async (req, res, next) => {
  try {
    console.log("Session user:", req.user);
    console.log("Session ID:", req.sessionID);

    if (!req.user) {
      console.log("No user in session");
      return res.status(401).json({ message: "Not authenticated" });
    }

    console.log("User authenticated:", req.user.email);
    next();
  } catch (error) {
    console.error("Auth error:", error);
    res.status(401).json({ message: "Authentication failed" });
  }
};

const adminAuth = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (req.user.role !== "admin") {
      console.log("Admin access denied:", req.user.email);
      return res.status(403).json({ message: "Admin access required" });
    }

    console.log("Admin access granted:", req.user.email);
    next();
  } catch (error) {
    console.error("auth error:", error);
    res.status(401).json({ message: "Authentication failed" });
  }
};

module.exports = { auth, adminAuth };
