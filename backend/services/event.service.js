import Event from "../models/event.model.js";

export async function createEvent(data) {
    return await Event.create(data);
}

export async function findPublishedEvents() {
    return await Event.find({ status: "PUBLISHED" }).sort({ startAt: 1 });
}

export async function findEventById(id) {
    return await Event.findById(id);
}

export async function findEventsByOrganizerId(organizerId) {
    return await Event.find({ organizerId }).sort({ createdAt: -1 });
}

export async function updateEventById(id, update) {
    return await Event.findByIdAndUpdate(id, update, { new: true });
}
