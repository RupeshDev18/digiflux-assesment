const express = require("express");
const { generateInvoice } = require("../controllers/invoiceController");
const { auth } = require("../middlewares/auth");
const router = express.Router();

router.get("/orders/:orderId/invoice", auth, async (req, res) => {
  try {
    await generateInvoice(req.params.orderId, res);
  } catch (error) {
    console.error("Invoice route error:", error);
    res.status(500).json({ message: "Failed to generate invoice" });
  }
});

module.exports = router;
