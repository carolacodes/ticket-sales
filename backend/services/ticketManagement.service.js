import Ticket from "../models/ticket.model.js";

export async function reinstateTicketById(ticketId) {
    return await Ticket.findByIdAndUpdate(
        ticketId,
        { status: "VALID", voidedAt: null, voidReason: null },
        { new: true }
    );
}

export async function findTicketById(ticketId) {
    return await Ticket.findById(ticketId);
}

export async function voidTicketById(ticketId, { reason }) {
    return await Ticket.findByIdAndUpdate(
        ticketId,
        { status: "VOID", voidedAt: new Date(), voidReason: reason || null },
        { new: true }
    );
}
