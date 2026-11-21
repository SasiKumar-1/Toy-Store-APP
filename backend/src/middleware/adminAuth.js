const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Access denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user || user.role !== "ADMIN") {
      return res.status(403).json({ error: "Admin privileges required" });
    }
    req.user = user;
    next();
  } catch (err) {
    res.status(400).json({ error: "Invalid token" });
  }
};
