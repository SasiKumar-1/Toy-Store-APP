import React, { useState, useEffect } from "react";
import axios from "axios";

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api" });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default function App() {
  const [tab, setTab] = useState("monitor");
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    lowStockToys: [],
    recentOrders: [],
  });
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    brand: "",
    category: "STEM",
    ageGroup: "6-8 yrs",
    price: "",
    mrp: "",
    stock: "",
    imageUrl: "",
  });

  const loadData = async () => {
    try {
      const [statsRes, prodRes] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/products"),
      ]);
      setStats(statsRes.data);
      setProducts(prodRes.data);
    } catch (err) {
      console.error("Ensure adminToken is set in localStorage", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddToy = async (e) => {
    e.preventDefault();
    await api.post("/admin/products", form);
    setForm({
      title: "",
      description: "",
      brand: "",
      category: "STEM",
      ageGroup: "6-8 yrs",
      price: "",
      mrp: "",
      stock: "",
      imageUrl: "",
    });
    loadData();
    setTab("inventory");
  };

  const handleStockUpdate = async (id, newStock) => {
    await api.patch(`/admin/products/${id}`, { stock: newStock });
    loadData();
  };

  const handleOrderStatus = async (orderId, status) => {
    await api.patch(`/admin/orders/${orderId}/status`, { status });
    loadData();
  };

  return (
    <div style={styles.page}>
      <header style={styles.navbar}>
        <h2>ToyStore Seller & Admin Hub</h2>
        <div style={styles.navButtons}>
          <button
            style={tab === "monitor" ? styles.activeBtn : styles.btn}
            onClick={() => setTab("monitor")}
          >
            Live Order Monitor
          </button>
          <button
            style={tab === "inventory" ? styles.activeBtn : styles.btn}
            onClick={() => setTab("inventory")}
          >
            Inventory ({products.length})
          </button>
          <button
            style={tab === "upload" ? styles.activeBtn : styles.btn}
            onClick={() => setTab("upload")}
          >
            + Upload New Toy
          </button>
        </div>
      </header>

      {/* KPI Summary Cards */}
      <div style={styles.kpiGrid}>
        <div style={styles.kpiCard}>
          <span>Total Revenue</span>
          <h3>₹{stats.totalRevenue.toLocaleString("en-IN")}</h3>
        </div>
        <div style={styles.kpiCard}>
          <span>Total Orders</span>
          <h3>{stats.totalOrders}</h3>
        </div>
        <div style={{ ...styles.kpiCard, borderLeft: "4px solid #d32f2f" }}>
          <span>Low Stock Alerts (≤10)</span>
          <h3>{stats.lowStockToys.length} Items</h3>
        </div>
      </div>

      {/* TAB 1: LIVE ORDER MONITORING */}
      {tab === "monitor" && (
        <div style={styles.card}>
          <h3>Order Fulfillment Queue</h3>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Amount</th>
                <th>Shipping Address</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentOrders.map((order) => (
                <tr key={order.id}>
                  <td>{order.id.slice(0, 8)}...</td>
                  <td>
                    {order.user?.name}
                    <br />
                    <small>{order.user?.email}</small>
                  </td>
                  <td>
                    {order.items.map((i) => (
                      <div key={i.id}>
                        {i.product?.title} × {i.quantity}
                      </div>
                    ))}
                  </td>
                  <td>
                    <strong>₹{order.totalAmount}</strong>
                  </td>
                  <td>{order.shippingAddress}</td>
                  <td>
                    <select
                      value={order.status}
                      onChange={(e) =>
                        handleOrderStatus(order.id, e.target.value)
                      }
                      style={styles.select}
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="PAID">PAID</option>
                      <option value="SHIPPED">SHIPPED</option>
                      <option value="DELIVERED">DELIVERED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: INVENTORY MANAGEMENT */}
      {tab === "inventory" && (
        <div style={styles.card}>
          <h3>Catalog & Stock Control</h3>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Toy</th>
                <th>Brand / Age</th>
                <th>Category</th>
                <th>Price / MRP</th>
                <th>Stock</th>
                <th>Quick Restock</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <img
                      src={p.imageUrl}
                      alt={p.title}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 6,
                        objectFit: "cover",
                      }}
                    />
                    {p.title}
                  </td>
                  <td>
                    {p.brand} ({p.ageGroup})
                  </td>
                  <td>{p.category}</td>
                  <td>
                    ₹{p.price}{" "}
                    <small
                      style={{ textDecoration: "line-through", color: "#888" }}
                    >
                      ₹{p.mrp}
                    </small>
                  </td>
                  <td
                    style={{
                      color: p.stock <= 10 ? "#d32f2f" : "#2e7d32",
                      fontWeight: 700,
                    }}
                  >
                    {p.stock} units
                  </td>
                  <td>
                    <button
                      style={styles.smallBtn}
                      onClick={() => handleStockUpdate(p.id, p.stock + 10)}
                    >
                      +10
                    </button>
                    <button
                      style={styles.smallBtn}
                      onClick={() =>
                        handleStockUpdate(p.id, Math.max(0, p.stock - 1))
                      }
                    >
                      -1
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: UPLOAD NEW TOY */}
      {tab === "upload" && (
        <form onSubmit={handleAddToy} style={styles.formCard}>
          <h3>Add New Toy to Storefront</h3>
          <input
            style={styles.input}
            placeholder="Toy Title (e.g., Nerf Elite 2.0 Blaster)"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <input
            style={styles.input}
            placeholder="Brand (e.g., Hasbro, LEGO, Funskool)"
            required
            value={form.brand}
            onChange={(e) => setForm({ ...form, brand: e.target.value })}
          />
          <div style={styles.row}>
            <select
              style={styles.input}
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option value="STEM">STEM</option>
              <option value="Vehicles">Vehicles</option>
              <option value="Soft Toys">Soft Toys</option>
              <option value="Board Games">Board Games</option>
              <option value="Action Figures">Action Figures</option>
            </select>
            <select
              style={styles.input}
              value={form.ageGroup}
              onChange={(e) => setForm({ ...form, ageGroup: e.target.value })}
            >
              <option value="0-2 yrs">0-2 yrs</option>
              <option value="3-5 yrs">3-5 yrs</option>
              <option value="6-8 yrs">6-8 yrs</option>
              <option value="8+ yrs">8+ yrs</option>
            </select>
          </div>
          <div style={styles.row}>
            <input
              style={styles.input}
              type="number"
              placeholder="Selling Price (₹)"
              required
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
            <input
              style={styles.input}
              type="number"
              placeholder="MRP (₹)"
              required
              value={form.mrp}
              onChange={(e) => setForm({ ...form, mrp: e.target.value })}
            />
            <input
              style={styles.input}
              type="number"
              placeholder="Initial Stock Qty"
              required
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
            />
          </div>
          <input
            style={styles.input}
            placeholder="Image URL (https://...)"
            required
            value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
          />
          <textarea
            style={styles.input}
            rows="3"
            placeholder="Product Description & Safety Notes"
            required
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <button type="submit" style={styles.submitBtn}>
            Publish Toy Live
          </button>
        </form>
      )}
    </div>
  );
}

const styles = {
  page: {
    fontFamily: "system-ui, sans-serif",
    background: "#f4f6f8",
    minHeight: "100vh",
    padding: 20,
  },
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#2874F0",
    color: "#fff",
    padding: "14px 24px",
    borderRadius: 10,
  },
  navButtons: { display: "flex", gap: 10 },
  btn: {
    background: "rgba(255,255,255,0.18)",
    color: "#fff",
    border: "none",
    padding: "8px 14px",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: 600,
  },
  activeBtn: {
    background: "#FF9F00",
    color: "#fff",
    border: "none",
    padding: "8px 14px",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: 700,
  },
  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 16,
    margin: "20px 0",
  },
  kpiCard: {
    background: "#fff",
    padding: 20,
    borderRadius: 10,
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  },
  card: {
    background: "#fff",
    padding: 20,
    borderRadius: 10,
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: 12,
    textAlign: "left",
  },
  select: {
    padding: 6,
    borderRadius: 6,
    border: "1px solid #ccc",
    fontWeight: 600,
  },
  smallBtn: {
    marginRight: 6,
    padding: "4px 10px",
    cursor: "pointer",
    borderRadius: 4,
    border: "1px solid #ccc",
  },
  formCard: {
    background: "#fff",
    padding: 24,
    borderRadius: 10,
    maxWidth: 600,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  row: { display: "flex", gap: 10 },
  input: {
    flex: 1,
    padding: 10,
    borderRadius: 6,
    border: "1px solid #ccc",
    fontSize: 14,
  },
  submitBtn: {
    background: "#FB641B",
    color: "#fff",
    border: "none",
    padding: 12,
    borderRadius: 6,
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
  },
};
