import { api } from "./axios.js"; // o la instancia axios que ya uses en tu proyecto

export function createPreferenceRequest(data) {
    return api.post("/payments/create-preference", data);
}

export const getMercadoPagoStatusRequest = () =>
    api.get("/payments/mercadopago/status");

export const connectMercadoPagoRequest = () =>
    api.get("/payments/mercadopago/connect");