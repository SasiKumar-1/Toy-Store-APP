import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  StyleSheet,
} from "react-native";
import { useCart } from "../context/CartContext";
import api from "../api/client";

export default function CartScreen({ navigation }) {
  const { cart, updateQty, cartTotal, clearCart } = useCart();
  const [address, setAddress] = useState(
    "42, Anna Nagar, Madurai, Tamil Nadu - 625020",
  );

  const handleCheckout = async () => {
    try {
      const items = cart.map((c) => ({
        productId: c.id,
        quantity: c.quantity,
      }));
      const res = await api.post("/orders/create", {
        items,
        shippingAddress: address,
      });

      // In production with EAS Build, pass res.data.razorpayOrder.id to react-native-razorpay
      Alert.alert(
        "Order Created",
        `Razorpay Order ID: ${res.data.razorpayOrder.id}\nTotal: ₹${cartTotal}\n\nReady for UPI/Card SDK capture.`,
        [
          {
            text: "OK",
            onPress: () => {
              clearCart();
              navigation.navigate("Orders");
            },
          },
        ],
      );
    } catch (err) {
      Alert.alert(
        "Checkout Error",
        err.response?.data?.error || "Please login first",
      );
    }
  };

  if (cart.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Your Toy Cart is empty!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.addressInput}
        value={address}
        onChangeText={setAddress}
        placeholder="Enter Delivery Address & Pincode"
      />
      <FlatList
        data={cart}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.price}>₹{item.price * item.quantity}</Text>
            </View>
            <View style={styles.qtyControls}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => updateQty(item.id, -1)}
              >
                <Text>-</Text>
              </TouchableOpacity>
              <Text style={styles.qtyText}>{item.quantity}</Text>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => updateQty(item.id, 1)}
              >
                <Text>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
      <View style={styles.footer}>
        <Text style={styles.total}>Total: ₹{cartTotal}</Text>
        <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
          <Text style={styles.checkoutText}>PLACE ORDER</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F1F3F6" },
  empty: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: 18, color: "#666" },
  addressInput: {
    backgroundColor: "#fff",
    padding: 14,
    margin: 10,
    borderRadius: 8,
    fontSize: 14,
  },
  itemRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 14,
    marginHorizontal: 10,
    marginBottom: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  title: { fontSize: 15, fontWeight: "600" },
  price: { fontSize: 16, fontWeight: "700", marginTop: 4 },
  qtyControls: { flexDirection: "row", alignItems: "center", gap: 12 },
  qtyBtn: {
    borderWidth: 1,
    borderColor: "#ccc",
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
  },
  qtyText: { fontWeight: "700" },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderTopWidth: 1,
    borderColor: "#eee",
  },
  total: { fontSize: 20, fontWeight: "800" },
  checkoutBtn: {
    backgroundColor: "#FB641B",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
  },
  checkoutText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
