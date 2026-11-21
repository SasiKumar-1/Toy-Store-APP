import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";

export default function ToyCard({ item, onPress, onAdd }) {
  const discount = Math.round(((item.mrp - item.price) / item.mrp) * 100);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Image source={{ uri: item.imageUrl }} style={styles.image} />
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{item.ageGroup}</Text>
      </View>
      <Text style={styles.brand}>{item.brand}</Text>
      <Text numberOfLines={2} style={styles.title}>
        {item.title}
      </Text>
      <Text style={styles.rating}>
        ★ {item.rating} • {item.category}
      </Text>
      <View style={styles.priceRow}>
        <Text style={styles.price}>₹{item.price}</Text>
        <Text style={styles.mrp}>₹{item.mrp}</Text>
        <Text style={styles.discount}>{discount}% off</Text>
      </View>
      <TouchableOpacity style={styles.btn} onPress={() => onAdd(item)}>
        <Text style={styles.btnText}>Add to Cart</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: "#fff",
    margin: 6,
    borderRadius: 10,
    padding: 10,
    elevation: 2,
  },
  image: { width: "100%", height: 130, borderRadius: 8, resizeMode: "cover" },
  badge: {
    position: "absolute",
    top: 16,
    left: 16,
    backgroundColor: "#2874F0",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  brand: { fontSize: 11, color: "#666", marginTop: 6, fontWeight: "600" },
  title: { fontSize: 14, fontWeight: "600", color: "#212121", height: 38 },
  rating: {
    fontSize: 12,
    color: "#388E3C",
    marginVertical: 3,
    fontWeight: "600",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  price: { fontSize: 16, fontWeight: "700", color: "#000" },
  mrp: { fontSize: 12, textDecorationLine: "line-through", color: "#878787" },
  discount: { fontSize: 12, color: "#388E3C", fontWeight: "700" },
  btn: {
    backgroundColor: "#FF9F00",
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
});
