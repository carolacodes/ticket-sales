import { api } from "./axios.js";

// Listar ticket types de un evento (sirve para organizer también)
export function listTicketTypesByEventRequest(eventId) {
  return api.get(`/events/${eventId}/ticket-types`);
}

// Crear ticket type
export function createTicketTypeRequest(eventId, data) {
  return api.post(`/events/${eventId}/ticket-types`, data);
}

// Editar ticket type
export function updateTicketTypeRequest(ticketTypeId, data) {
  return api.patch(`/ticket-types/${ticketTypeId}`, data);
}

// Eliminar ticket type
export function deleteTicketTypeRequest(ticketTypeId) {
  return api.delete(`/ticket-types/${ticketTypeId}`);
}  