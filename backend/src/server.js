require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
app.use(cors({ origin: allowedOrigins.length ? allowedOrigins : true }));

app.use("/api/webhooks", express.raw({ type: "application/json", limit: "1mb" }), require("./routes/webhooks"));
app.use(express.json({ limit: "1mb" }));

app.use("/api/auth", require("./routes/auth"));
app.use("/api/products", require("./routes/products"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/admin", require("./routes/admin"));

app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use((req, res) => res.status(404).json({ error: "Route not found" }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: process.env.NODE_ENV === "production" ? "Internal server error" : err.message });
});

if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === "production") {
    console.error("JWT_SECRET is required");
    process.exit(1);
  }
  process.env.JWT_SECRET = "local-development-secret-change-before-production";
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`ToyStore API running on port ${PORT}`));
