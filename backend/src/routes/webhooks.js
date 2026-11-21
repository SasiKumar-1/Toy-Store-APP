const express = require("express");
const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");

const router = express.Router();
const prisma = new PrismaClient();

router.post("/razorpay", async (req, res) => {
  try {
    const signature = req.header("x-razorpay-signature") || "";
    const expected = crypto.createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(req.body).digest("hex");
    const a = Buffer.from(signature, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return res.status(400).json({ error: "Invalid webhook signature" });
    }

    const event = JSON.parse(req.body.toString("utf8"));
    const paymentEntity = event.payload?.payment?.entity;
    const rzpOrderId = paymentEntity?.order_id;
    if (!rzpOrderId) return res.json({ received: true });

    const order = await prisma.order.findUnique({
      where: { razorpayOrderId: rzpOrderId },
      include: { items: true },
    });
    if (!order) return res.json({ received: true });

    if (event.event === "payment.captured" && order.status !== "PAID") {
      await prisma.$transaction(async (tx) => {
        for (const item of order.items) {
          const result = await tx.product.updateMany({
            where: { id: item.productId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (result.count !== 1) throw new Error("INSUFFICIENT_STOCK");
        }
        await tx.order.update({
          where: { id: order.id },
          data: { status: "PAID", razorpayPaymentId: paymentEntity.id },
        });
        await tx.orderEvent.create({
          data: {
            orderId: order.id,
            stage: "PAYMENT_VERIFIED",
            actor: "RAZORPAY_WEBHOOK",
            note: `Captured ₹${order.totalAmount} (${paymentEntity.method || "UPI/Card"})`,
          },
        });
      });
    }

    if (event.event === "payment.failed") {
      await prisma.orderEvent.create({
        data: {
          orderId: order.id,
          stage: "PAYMENT_FAILED",
          actor: "RAZORPAY_WEBHOOK",
          note: paymentEntity.error_description || "Payment failed at gateway",
        },
      });
    }

    res.json({ received: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

module.exports = router;
