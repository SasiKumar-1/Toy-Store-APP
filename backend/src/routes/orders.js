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

router.post("/create", auth, async (req, res) => {
  try {
    const { items, shippingAddress } = req.body;
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: "At least one item is required" });
    if (!shippingAddress?.trim()) return res.status(400).json({ error: "Shipping address is required" });

    const productIds = [...new Set(items.map((item) => item.productId))];
    const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
    const byId = new Map(products.map((product) => [product.id, product]));
    let totalAmount = 0;
    const orderItemsData = [];

    for (const item of items) {
      const quantity = Number(item.quantity);
      if (!Number.isInteger(quantity) || quantity < 1) return res.status(400).json({ error: "Invalid quantity" });
      const product = byId.get(item.productId);
      if (!product) return res.status(404).json({ error: "Toy not found" });
      if (product.stock < quantity) return res.status(400).json({ error: `${product.title} is out of stock` });
      totalAmount += product.price * quantity;
      orderItemsData.push({ productId: product.id, quantity, price: product.price });
    }

    const rzpOrder = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100),
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
    });
    const order = await prisma.order.create({
      data: {
        userId: req.user.id,
        totalAmount,
        shippingAddress: shippingAddress.trim(),
        razorpayOrderId: rzpOrder.id,
        items: { create: orderItemsData },
      },
    });

    res.status(201).json({ order, razorpayOrder: rzpOrder, keyId: process.env.RAZORPAY_KEY_ID });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Unable to create order" });
  }
});

router.post("/verify", auth, async (req, res) => {
  try {
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: "Missing payment verification fields" });
    }

    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: req.user.id, razorpayOrderId: razorpay_order_id },
      include: { items: true },
    });
    if (!order) return res.status(404).json({ error: "Order not found" });

    const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex");
    const signatureBuffer = Buffer.from(razorpay_signature, "hex");
    const expectedBuffer = Buffer.from(expected, "hex");
    const signatureMatches = signatureBuffer.length === expectedBuffer.length &&
      crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
    if (!signatureMatches) return res.status(400).json({ error: "Payment verification failed" });

    if (order.status === "PAID") return res.json({ success: true, order });

    const updatedOrder = await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        const stockResult = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (stockResult.count !== 1) throw new Error("INSUFFICIENT_STOCK");
      }
      return tx.order.update({
        where: { id: order.id },
        data: { status: "PAID", razorpayPaymentId: razorpay_payment_id },
        include: { items: true },
      });
    });

    res.json({ success: true, order: updatedOrder });
  } catch (error) {
    if (error.message === "INSUFFICIENT_STOCK") return res.status(409).json({ error: "One or more products no longer have enough stock" });
    console.error(error);
    res.status(500).json({ error: "Unable to verify payment" });
  }
});

router.get("/my-orders", auth, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: "Unable to load orders" });
  }
});

module.exports = router;
