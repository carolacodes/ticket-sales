import { api } from "./axios.js";

export function resendVerifyEmailRequest() {
    return api.post("/auth/verify-email/resend");
}
