import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Set EXPO_PUBLIC_API_URL for deployed builds, or use the emulator default for local Android.
const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:5000/api";

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
