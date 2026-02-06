import TicketType from "../models/ticketType.model.js";

export async function createTicketType(data) {
    return await TicketType.create(data);
}

export async function findTicketTypesByEventId(eventId) {
    return await TicketType.find({ eventId }).sort({ createdAt: -1 });
}

export async function findTicketTypeById(id) {
    return await TicketType.findById(id);
}

export async function updateTicketTypeById(id, update) {
    return await TicketType.findByIdAndUpdate(id, update, { new: true });
}

export async function deleteTicketTypeById(id) {
    return await TicketType.findByIdAndDelete(id);
}

export async function findTicketTypesByEventId(eventId) {
    return TicketType.find({ eventId }).sort({ price: 1 });
}
