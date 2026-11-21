const express = require("express");
const { PrismaClient } = require("@prisma/client");
const adminAuth = require("../middleware/adminAuth");

const router = express.Router();
const prisma = new PrismaClient();

// 1. Dashboard KPIs & Low-Stock Alerts
router.get("/stats", adminAuth, async (req, res) => {
  try {
    const [totalOrders, revenueAgg, lowStockToys, recentOrders] =
      await Promise.all([
        prisma.order.count(),
        prisma.order.aggregate({
          where: { status: { in: ["PAID", "SHIPPED", "DELIVERED"] } },
          _sum: { totalAmount: true },
        }),
        prisma.product.findMany({
          where: { stock: { lte: 10 } },
          orderBy: { stock: "asc" },
        }),
        prisma.order.findMany({
          take: 15,
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { name: true, email: true } },
            items: { include: { product: { select: { title: true } } } },
          },
        }),
      ]);

    res.json({
      totalOrders,
      totalRevenue: revenueAgg._sum.totalAmount || 0,
      lowStockToys,
      recentOrders,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Upload New Toy
router.post("/products", adminAuth, async (req, res) => {
  try {
    const {
      title,
      description,
      brand,
      category,
      ageGroup,
      price,
      mrp,
      stock,
      imageUrl,
    } = req.body;
    const toy = await prisma.product.create({
      data: {
        title,
        description,
        brand,
        category,
        ageGroup,
        price: Number(price),
        mrp: Number(mrp),
        stock: Number(stock),
        imageUrl,
      },
    });
    res.status(201).json(toy);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 3. Update Stock or Price
router.patch("/products/:id", adminAuth, async (req, res) => {
  try {
    const { stock, price, mrp } = req.body;
    const updated = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        ...(stock !== undefined && { stock: Number(stock) }),
        ...(price !== undefined && { price: Number(price) }),
        ...(mrp !== undefined && { mrp: Number(mrp) }),
      },
    });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 4. Delete Toy
router.delete("/products/:id", adminAuth, async (req, res) => {
  try {
    await prisma.product.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res
      .status(400)
      .json({ error: "Cannot delete toy linked to existing orders" });
  }
});

// 5. Update Order Fulfillment Status
router.patch("/orders/:id/status", adminAuth, async (req, res) => {
  try {
    const { status } = req.body; // PAID, SHIPPED, DELIVERED, CANCELLED
    const allowed = ["PAID", "SHIPPED", "DELIVERED", "CANCELLED"];
    if (!allowed.includes(status)) return res.status(400).json({ error: "Invalid order status" });
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status },
    });
    res.json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
