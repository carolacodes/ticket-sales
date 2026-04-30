import { api } from "./axios.js"; // o la instancia axios que ya uses en tu proyecto

export function createPreferenceRequest(data) {
    return api.post("/payments/create-preference", data);
}