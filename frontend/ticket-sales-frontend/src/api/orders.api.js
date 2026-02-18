import { api } from "./axios.js";

export function createOrderRequest(data) {
    return api.post("/orders", data);
}

export function confirmOrderRequest(orderId, data = {}) {
    return api.post(`/orders/${orderId}/confirm`, data);
}

export function listMyOrdersRequest() {
    return api.get("/orders/me");
}
