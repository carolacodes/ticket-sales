import { api } from "./axios.js";

/**
 * Trae tickets del usuario logueado (buyer)
 * Backend: GET /api/tickets/me
 */
export function getMyTickets() {
    return api.get("/tickets/me");
}
