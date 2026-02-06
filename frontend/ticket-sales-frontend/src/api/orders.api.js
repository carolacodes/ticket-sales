import { api } from "./axios.js";

/**
 * Crea una orden en estado PENDING
 * Backend: POST /api/orders
 */
export function createOrder({ eventId, items }) {
    return api.post("/orders", { eventId, items });
}

/**
 * Confirma la orden (fake pay) => genera tickets + manda email
 * Backend: POST /api/orders/:id/confirm
 */
export function confirmOrder(orderId) {
    return api.post(`/orders/${orderId}/confirm`);
}
