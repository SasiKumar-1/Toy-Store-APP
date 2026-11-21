const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");
const auth = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Step 1: Create Order & Razorpay Intent
router.post("/create", auth, async (req, res) => {
  try {
    const { items, shippingAddress } = req.body; // items: [{ productId, quantity }]
    let totalAmount = 0;
    const orderItemsData = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });
      if (!product || product.stock < item.quantity) {
        return res
          .status(400)
          .json({ error: `${product?.title || "Item"} is out of stock` });
      }
      totalAmount += product.price * item.quantity;
      orderItemsData.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.price,
      });
    }

    const rzpOrder = await razorpay.orders.create({
      amount: totalAmount * 100, // Amount in paise
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
    });

    const order = await prisma.order.create({
      data: {
        userId: req.user.id,
        totalAmount,
        shippingAddress,
        razorpayOrderId: rzpOrder.id,
        items: { create: orderItemsData },
      },
    });

    res.json({
      order,
      razorpayOrder: rzpOrder,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Step 2: Verify Payment & Deduct Stock
router.post("/verify", auth, async (req, res) => {
  try {
    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ error: "Payment verification failed" });
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id: orderId },
        data: { status: "PAID", razorpayPaymentId: razorpay_payment_id },
        include: { items: true },
      });

      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }
      return order;
    });

    res.json({ success: true, order: updatedOrder });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get User Order History
router.get("/my-orders", auth, async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.user.id },
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(orders);
});

module.exports = router;
