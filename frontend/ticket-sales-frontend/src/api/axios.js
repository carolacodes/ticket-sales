import axios from "axios";
import { getAccessToken } from "../libs/token";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export const api = axios.create({
    baseURL: `${API_URL}/api`,
    withCredentials: true, // envía cookies (refreshToken httpOnly)
});

// --------------------
// Request interceptor: agrega Authorization
// --------------------
api.interceptors.request.use((config) => {
    const token = getAccessToken(); // token en memoria
    if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
