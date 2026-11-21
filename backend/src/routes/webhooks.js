const express = require("express");
const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");

const router = express.Router();
const prisma = new PrismaClient();

router.post("/razorpay", async (req, res) => {
  const signature = req.header("x-razorpay-signature");
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(req.body)
    .digest("hex");

  if (!signature || signature !== expected) {
    return res.status(400).json({ error: "Invalid webhook signature" });
  }

  const event = JSON.parse(req.body.toString());
  const paymentEntity = event.payload?.payment?.entity;
  const rzpOrderId = paymentEntity?.order_id;

  if (!rzpOrderId) return res.json({ received: true });

  const order = await prisma.order.findFirst({
    where: { razorpayOrderId: rzpOrderId },
  });
  if (!order) return res.json({ received: true });

  if (event.event === "payment.captured" && order.status !== "PAID") {
    await prisma.$transaction(async (tx) => {
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
});

module.exports = router;
