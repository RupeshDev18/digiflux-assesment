const PDFDocument = require("pdfkit");
const Order = require("../models/Order");

const generateInvoice = async (orderId, res) => {
  try {
    console.log("Generating invoice for order:", orderId);
    const order = await Order.findById(orderId)
      .populate("user")
      .populate("items.product");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${orderId}.pdf`
    );

    doc.pipe(res);

    doc
      .fontSize(24)
      .font("Helvetica-Bold")
      .text("INVOICE", { align: "center" });
    doc.moveDown(0.5);

    doc
      .fontSize(12)
      .font("Helvetica")
      .text(`Order #: ${order._id.toString().slice(-8).toUpperCase()}`, {
        align: "center",
      })
      .text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, {
        align: "center",
      });

    doc.moveDown(1);

    doc.fontSize(12).font("Helvetica-Bold").text("Customer:", 50, doc.y);

    doc
      .fontSize(10)
      .font("Helvetica")
      .text(order.shippingAddress.fullName, 50)
      .text(order.shippingAddress.address, 50)
      .text(
        `${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}`,
        50
      );

    doc.moveDown(2);

    doc.fontSize(14).font("Helvetica-Bold").text("ORDER ITEMS", 50, doc.y);
    doc.moveDown(0.5);

    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    let y = doc.y;

    order.items.forEach((item, index) => {
      const productName = item.product?.name || "Product";
      const quantity = item.quantity;
      const price = item.price;
      const amount = price * quantity;

      doc
        .fontSize(10)
        .font("Helvetica")
        .text(`${productName}`, 50, y)
        .text(`Qty: ${quantity}`, 50, y + 12);

      doc
        .text(`$${price.toFixed(2)} each`, 400, y)
        .text(`$${amount.toFixed(2)}`, 500, y + 12, { align: "right" });

      y += 30;

      if (y > 700) {
        doc.addPage();
        y = 50;
      }
    });

    doc.moveTo(50, y).lineTo(550, y).stroke();
    y += 20;

    const subtotal = order.totalAmount;
    const shipping = subtotal > 50 ? 0 : 10;
    const tax = subtotal * 0.1;
    const total = subtotal + shipping + tax;

    doc
      .fontSize(12)
      .font("Helvetica")
      .text(`Subtotal: $${subtotal.toFixed(2)}`, 400, y, { align: "right" });
    y += 15;

    doc.text(
      `Shipping: ${shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`}`,
      400,
      y,
      { align: "right" }
    );
    y += 15;

    doc.text(`Tax: $${tax.toFixed(2)}`, 400, y, { align: "right" });
    y += 20;

    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text(`TOTAL: $${total.toFixed(2)}`, 400, y, { align: "right" });
    y += 30;
    // footer
    doc
      .fontSize(10)
      .font("Helvetica")
      .text("Thank you for your purchase!", { align: "center" })
      .text(
        `Order Status: ${order.status.toUpperCase()} | Payment: ${order.paymentStatus.toUpperCase()}`,
        { align: "center" }
      );

    doc.end();

    console.log(" Invoice generated successfully for order:", orderId);
  } catch (error) {
    console.error(" Invoice generation error:", error);
    res.status(500).json({ message: "Failed to generate invoice" });
  }
};

module.exports = { generateInvoice };
