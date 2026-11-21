// mobile-app/App.js
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { CartProvider, useCart } from "./src/context/CartContext";

import HomeScreen from "./src/screens/HomeScreen";
import ProductDetailScreen from "./src/screens/ProductDetailScreen";
import CartScreen from "./src/screens/CartScreen";
import OrdersScreen from "./src/screens/OrdersScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Browse"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{ title: "Toy Details" }}
      />
    </Stack.Navigator>
  );
}

function MainTabs() {
  const { cartCount } = useCart();
  return (
    <Tab.Navigator screenOptions={{ tabBarActiveTintColor: "#2874F0" }}>
      <Tab.Screen
        name="Shop"
        component={HomeStack}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{ tabBarBadge: cartCount || undefined }}
      />
      <Tab.Screen name="Orders" component={OrdersScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <CartProvider>
      <NavigationContainer>
        <MainTabs />
      </NavigationContainer>
    </CartProvider>
  );
}
