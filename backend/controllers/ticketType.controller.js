import {
    createTicketType,
    findTicketTypesByEventId,
    updateTicketTypeById,
    deleteTicketTypeById,
} from "../services/ticketType.service.js";
import { findEventById } from "../services/event.service.js";

// POST /events/:eventId/ticket-types (ORGANIZER dueño)
export async function create(req, res, next) {
    try {
        const { eventId } = req.params;

        const event = await findEventById(eventId);
        if (!event) return res.status(404).json({ message: "Event not found" });

        // Solo el owner del evento puede crear ticket types
        if (event.organizerId.toString() !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
        }

        const ticketType = await createTicketType({
        ...req.body,
        eventId,
        soldCount: 0, // controlado por backend
        });

        return res.status(201).json({ ticketType });
    } catch (err) {
        next(err);
    }
}

// GET /events/:eventId/ticket-types (público si PUBLISHED; owner si no)
export async function listByEvent(req, res, next) {
    try {
        const { eventId } = req.params;

        const event = await findEventById(eventId);
        if (!event) return res.status(404).json({ message: "Event not found" });

        // Si el evento NO está publicado: solo owner puede ver ticket types
        if (event.status !== "PUBLISHED") {
        if (!req.user) return res.status(403).json({ message: "Forbidden" });
        if (event.organizerId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Forbidden" });
        }
        }

        const ticketTypes = await findTicketTypesByEventId(eventId);
        return res.status(200).json({ ticketTypes });
    } catch (err) {
        next(err);
    }
}

// PATCH /ticket-types/:id (ORGANIZER dueño)
export async function update(req, res, next) {
    try {
        const current = req.ticketType; // viene del middleware requireTicketTypeOwner

        // Regla importante: capacity no puede bajar de soldCount
        if (req.body.capacity !== undefined) {
        if (req.body.capacity < current.soldCount) {
            return res.status(400).json({
            message: "capacity cannot be lower than soldCount",
            });
        }
        }

        const updated = await updateTicketTypeById(current._id, req.body);
        return res.status(200).json({ ticketType: updated });
    } catch (err) {
        next(err);
    }
}

// DELETE /ticket-types/:id (ORGANIZER dueño)
export async function remove(req, res, next) {
    try {
        const current = req.ticketType; // viene del middleware requireTicketTypeOwner
        await deleteTicketTypeById(current._id);
        return res.status(200).json({ ok: true });
    } catch (err) {
        next(err);
    }
}
