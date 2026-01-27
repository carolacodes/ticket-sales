import Ticket from "../models/ticket.model.js";

export async function createManyTickets(tickets, session) {
    return await Ticket.insertMany(tickets, session ? { session } : undefined);
}

export async function findTicketsByUserId(userId) {
    return await Ticket.find({ userId }).sort({ createdAt: -1 });
}

export async function findTicketByCode(code) {
    return await Ticket.findOne({ code });
}

export async function updateTicketById(id, update, session) {
    return await Ticket.findByIdAndUpdate(id, update, { new: true, session });
}
