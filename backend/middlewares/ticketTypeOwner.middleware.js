import { findTicketTypeById } from "../services/ticketType.service.js";
import { findEventById } from "../services/event.service.js";

export const requireTicketTypeOwner = async (req, res, next) => {
    try {
        const ticketType = await findTicketTypeById(req.params.id);
        if (!ticketType) return res.status(404).json({ message: "TicketType not found" });

        const event = await findEventById(ticketType.eventId);
        if (!event) return res.status(404).json({ message: "Event not found" });

        if (event.organizerId.toString() !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
        }

        // guardamos para reutilizar sin nuevas queries
        req.ticketType = ticketType;
        req.event = event;

        next();
    } catch (err) {
        next(err);
    }
};
