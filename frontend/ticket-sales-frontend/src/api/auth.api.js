import { api } from "./axios.js";

export function loginRequest(data) {
    return api.post("/auth/login", data);
}

export function registerRequest(data) {
    return api.post("/auth/register", data);
}

export function refreshRequest() {
    return api.get("/auth/refresh");
}

export function logoutRequest() {
    return api.post("/auth/logout");
}


// Google OAuth: redirige al backend
export function googleOAuthUrl() {
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
    return `${API_URL}/api/auth/google`;
}
