const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Order = require("../models/Order");
const { auth } = require("../middlewares/auth");
const User = require("../models/User");
const Product = require("../models/Product");
const router = express.Router();

router.post("/", auth, async (req, res) => {
  try {
    const { items, shippingAddress, totalAmount } = req.body;

    console.log("Order request received:", {
      user: req.user.email,
      itemsCount: items?.length,
      totalAmount: totalAmount,
    });

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Items array is required." });
    }

    if (!totalAmount || isNaN(totalAmount) || totalAmount < 0.5) {
      return res.status(400).json({
        message: "Total amount must be at least $0.50 and a valid number.",
      });
    }

    // checking all products exist and have stock
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(400).json({
          message: `Product ${item.product} not found`,
        });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`,
        });
      }
    }

    const order = new Order({
      user: req.user._id,
      items: items.map((item) => ({
        product: item.product,
        quantity: item.quantity,
        price: Number(item.price),
      })),
      totalAmount: totalAmount,
      shippingAddress: shippingAddress,
      status: "pending",
      paymentStatus: "pending",
    });

    await order.save();

    // Update product stock after sucessful order
    for (const item of items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }

    await order.populate("items.product");

    console.log("Order created successfully:", order._id);

    res.status(201).json({
      success: true,
      order: order,
      message: "Order created successfully",
    });
  } catch (error) {
    console.error("Order creation error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object;
      await Order.findOneAndUpdate(
        { paymentIntentId: paymentIntent.id },
        { paymentStatus: "paid", status: "processing" }
      );
    }

    res.json({ received: true });
  }
);

// Get user orders
router.get("/", auth, async (req, res) => {
  try {
    console.log("Fetching orders for user:", req.user.email);

    const orders = await Order.find({ user: req.user._id })
      .populate("items.product")
      .sort({ createdAt: -1 });

    console.log("Found orders:", orders.length);

    res.json({
      success: true,
      orders: orders,
      message: "Orders fetched successfully",
    });
  } catch (error) {
    console.error("orders error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.get("/:id", auth, async (req, res) => {
  try {
    console.log(" Fetching order:", req.params.id, "for user:", req.user.email);

    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).populate("items.product");

    if (!order) {
      console.log("Order not found:", req.params.id);
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    console.log("Order found:", order._id);

    res.json({
      success: true,
      order: order,
      message: "Order fetched successfully",
    });
  } catch (error) {
    console.error("order error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
