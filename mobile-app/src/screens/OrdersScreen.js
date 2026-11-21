// mobile-app/src/screens/OrdersScreen.js
import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import api from "../api/client";

export default function OrdersScreen() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api
      .get("/orders/my-orders")
      .then((res) => setOrders(res.data))
      .catch(() => {});
  }, []);

  return (
    <FlatList
      style={styles.container}
      data={orders}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.status}>Status: {item.status}</Text>
          <Text style={styles.amount}>Total Paid: ₹{item.totalAmount}</Text>
          <Text style={styles.address}>Deliver to: {item.shippingAddress}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F1F3F6", padding: 10 },
  card: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 8,
    marginBottom: 10,
  },
  status: { fontWeight: "700", color: "#388E3C", marginBottom: 4 },
  amount: { fontSize: 16, fontWeight: "700" },
  address: { fontSize: 13, color: "#666", marginTop: 4 },
});
