import { api } from "./axios.js";

/**
 * Trae tickets del usuario logueado (buyer)
 * Backend: GET /api/tickets/me
 */
export function getMyTickets() {
    return api.get("/tickets/me");
}

/**
 * Check-in de un ticket por parte del staff (ORGANIZER)
 * @param {*} code 
 * @returns 
 */
export function checkInTicket(code) {
  return api.post("/tickets/check-in", { code });
} 

export function getEventTicketsForCheckIn(eventId) {
  return api.get(`/tickets/event/${eventId}`);
}