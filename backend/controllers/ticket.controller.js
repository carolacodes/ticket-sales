import { findTicketsByUserId, updateTicketById } from "../services/ticket.service.js";

export async function listMine(req, res, next) {
    try {
        const tickets = await findTicketsByUserId(req.user.id);
        return res.status(200).json({ tickets });
    } catch (err) {
        next(err);
    }
}

export async function checkIn(req, res, next) {
    try {
        // req.ticket viene del middleware requireTicketEventOwner
        const ticket = req.ticket;

        if (ticket.status !== "VALID") {
        return res.status(400).json({ message: `Ticket is ${ticket.status}` });
        }

        const updated = await updateTicketById(ticket._id, {
        status: "USED",
        checkedInAt: new Date(),
        });

        return res.status(200).json({ ticket: updated });
    } catch (err) {
        next(err);
    }
}
