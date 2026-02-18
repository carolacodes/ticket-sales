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

// ✅ Email verification
export function verifyEmailRequest(token) {
    return api.post("/auth/verify-email", { token });
}

export function resendVerificationRequest(email) {
    return api.post("/auth/resend-verification", { email });
}

    // ✅ Password reset
export function forgotPasswordRequest(email) {
    return api.post("/auth/forgot-password", { email });
}

export function resetPasswordRequest({ token, password }) {
    return api.post("/auth/reset-password", { token, password });
}

// Google OAuth: redirige al backend
export function googleOAuthUrl() {
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
    return `${API_URL}/api/auth/google`;
}
