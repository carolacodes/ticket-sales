import { findTicketByCode } from "../services/ticket.service.js";
import { findEventById } from "../services/event.service.js";

export const requireTicketEventOwner = async (req, res, next) => {
    try {
        const { code } = req.body;

        const ticket = await findTicketByCode(code);
        if (!ticket) return res.status(404).json({ message: "Ticket not found" });

        const event = await findEventById(ticket.eventId);
        if (!event) return res.status(404).json({ message: "Event not found" });

        if (event.organizerId.toString() !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
        }

        req.ticket = ticket;
        req.event = event;
        next();
    } catch (err) {
        next(err);
    }
};
