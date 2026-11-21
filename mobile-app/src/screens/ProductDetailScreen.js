import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useCart } from "../context/CartContext";

export default function ProductDetailScreen({ route, navigation }) {
  const { product } = route.params;
  const { addToCart } = useCart();

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: product.imageUrl }} style={styles.image} />
      <View style={styles.details}>
        <Text style={styles.brand}>
          {product.brand} • Age {product.ageGroup}
        </Text>
        <Text style={styles.title}>{product.title}</Text>
        <Text style={styles.rating}>
          ★ {product.rating} Rated • In Stock ({product.stock} left)
        </Text>
        <View style={styles.priceBox}>
          <Text style={styles.price}>₹{product.price}</Text>
          <Text style={styles.mrp}>MRP ₹{product.mrp}</Text>
        </View>
        <Text style={styles.sectionTitle}>Product Highlights</Text>
        <Text style={styles.desc}>{product.description}</Text>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.cartBtn}
            onPress={() => addToCart(product)}
          >
            <Text style={styles.btnText}>ADD TO CART</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.buyBtn}
            onPress={() => {
              addToCart(product);
              navigation.navigate("Cart");
            }}
          >
            <Text style={styles.btnText}>BUY NOW</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  image: { width: "100%", height: 320, resizeMode: "cover" },
  details: { padding: 16 },
  brand: { color: "#2874F0", fontWeight: "700", fontSize: 13 },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginVertical: 6,
    color: "#212121",
  },
  rating: { color: "#388E3C", fontWeight: "600", marginBottom: 10 },
  priceBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  price: { fontSize: 24, fontWeight: "800" },
  mrp: { fontSize: 15, textDecorationLine: "line-through", color: "#878787" },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 6 },
  desc: { fontSize: 14, lineHeight: 21, color: "#444", marginBottom: 24 },
  actions: { flexDirection: "row", gap: 10 },
  cartBtn: {
    flex: 1,
    backgroundColor: "#FF9F00",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buyBtn: {
    flex: 1,
    backgroundColor: "#FB641B",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
