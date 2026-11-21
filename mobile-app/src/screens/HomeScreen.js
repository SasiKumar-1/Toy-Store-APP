import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  FlatList,
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
} from "react-native";
import api from "../api/client";
import ToyCard from "../components/ToyCard";
import { useCart } from "../context/CartContext";

const CATEGORIES = ["All", "STEM", "Vehicles", "Soft Toys", "Board Games"];
const AGE_GROUPS = ["All", "0-2 yrs", "3-5 yrs", "6-8 yrs", "8+ yrs"];

export default function HomeScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [ageGroup, setAgeGroup] = useState("All");
  const { addToCart } = useCart();

  const fetchToys = async () => {
    const res = await api.get("/products", {
      params: { search, category, ageGroup },
    });
    setProducts(res.data);
  };

  useEffect(() => {
    fetchToys();
  }, [search, category, ageGroup]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TextInput
          style={styles.searchBar}
          placeholder="Search LEGO, Hot Wheels, Soft Toys..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Category Chips */}
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipRow}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, category === cat && styles.activeChip]}
              onPress={() => setCategory(cat)}
            >
              <Text
                style={[
                  styles.chipText,
                  category === cat && styles.activeChipText,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Age Group Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipRow}
        >
          {AGE_GROUPS.map((age) => (
            <TouchableOpacity
              key={age}
              style={[styles.chip, ageGroup === age && styles.activeAgeChip]}
              onPress={() => setAgeGroup(age)}
            >
              <Text
                style={[
                  styles.chipText,
                  ageGroup === age && styles.activeChipText,
                ]}
              >
                Age: {age}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={products}
        numColumns={2}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ToyCard
            item={item}
            onPress={() =>
              navigation.navigate("ProductDetail", { product: item })
            }
            onAdd={addToCart}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F1F3F6" },
  header: { backgroundColor: "#2874F0", padding: 12, paddingTop: 40 },
  searchBar: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 14,
    height: 42,
    fontSize: 15,
  },
  chipRow: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: "#fff",
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#F0F2F5",
    marginRight: 8,
  },
  activeChip: { backgroundColor: "#2874F0" },
  activeAgeChip: { backgroundColor: "#FB641B" },
  chipText: { fontSize: 12, fontWeight: "600", color: "#333" },
  activeChipText: { color: "#fff" },
});
