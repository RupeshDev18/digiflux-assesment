const express = require("express");
const cors = require("cors");
const passport = require("passport");
const session = require("express-session");
const path = require("path");
const MongoStore = require("connect-mongo");
const invoiceRoutes = require("./routes/invoice");
require("./config/passport");

const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const orderRoutes = require("./routes/orders");

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Session configuration
app.use(
  session({
    name: "ecommerce.sid",
    secret: process.env.SESSION_SECRET || "digifluxtesting",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: "lax",
    },
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  console.log("🔐 Session ID:", req.sessionID);
  console.log(
    "🔐 Session user:",
    req.user ? req.user.email : "Not authenticated"
  );
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api", invoiceRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ message: "Server is running!" });
});

module.exports = app;
