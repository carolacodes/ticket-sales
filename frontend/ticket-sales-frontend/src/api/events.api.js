import { api } from "./axios.js";

// Público: eventos publicados
export function listPublishedEvents(params = {}) {
  // params: page, limit, q, from, to, tags...
    return api.get("/events", { params });
}

// Público: detalle
export function getEventById(id) {
    return api.get(`/events/${id}`);
}

export function getEventTicketTypes(eventId) {
  return api.get(`/events/${eventId}/ticket-types`);
}
