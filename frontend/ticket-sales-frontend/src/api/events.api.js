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

export function listMyEventsRequest() {
  return api.get("/events/me");
}

export function myEventsSummaryRequest() {
  return api.get("/events/me/summary");
}

export function updateEventStatusRequest(id, data) {
  // data: { status: "DRAFT" | "PUBLISHED" | ... }
  return api.patch(`/events/${id}/status`, data);
}

export function eventSummaryRequest(id) {
  return api.get(`/events/${id}/summary`);
}

// Organizer dashboard summary
export function getMyEventsSummaryRequest() {
  return api.get("/events/me/summary");
}

// Organizer events list (optional if you want full event objects)
export function getMyEventsRequest() {
  return api.get("/events/me");
}

// Event summary (insights)
export function getEventSummaryRequest(eventId) {
  return api.get(`/events/${eventId}/summary`);
}

// Create event
export function createEventRequest(data) {
  return api.post("/events", data);
}
