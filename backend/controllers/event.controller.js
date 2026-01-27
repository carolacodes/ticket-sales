import {
    createEvent,
    findPublishedEvents,
    findEventById,
    findEventsByOrganizerId,
    updateEventById,
} from "../services/event.service.js";

export async function create(req, res, next) {
    try {
        // req.user viene del middleware requireAuth
        const organizerId = req.user.id;

        const event = await createEvent({
        ...req.body,
        organizerId,
        status: "DRAFT", // default controlado acá (no confiamos en el client)
        });

        return res.status(201).json({ event });
    } catch (err) {
        next(err);
    }
}

export async function listPublished(req, res, next) {
    try {
        const events = await findPublishedEvents();
        return res.status(200).json({ events });
    } catch (err) {
        next(err);
    }
}

export async function getById(req, res, next) {
    try {
        const event = await findEventById(req.params.id);
        if (!event) return res.status(404).json({ message: "Event not found" });

        // Regla simple:
        // - si está publicado, cualquiera lo puede ver
        // - si NO está publicado, solo el owner lo puede ver
        if (event.status !== "PUBLISHED") {
        if (!req.user) return res.status(403).json({ message: "Forbidden" });
        if (event.organizerId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Forbidden" });
        }
        }

        return res.status(200).json({ event });
    } catch (err) {
        next(err);
    }
}

export async function listMine(req, res, next) {
    try {
        const events = await findEventsByOrganizerId(req.user.id);
        return res.status(200).json({ events });
    } catch (err) {
        next(err);
    }
}

export async function update(req, res, next) {
    try {
        // req.event lo setea requireEventOwner
        const updated = await updateEventById(req.event._id, req.body);
        return res.status(200).json({ event: updated });
    } catch (err) {
        next(err);
    }
}

export async function updateStatus(req, res, next) {
    try {
        // req.event lo setea requireEventOwner
        const updated = await updateEventById(req.event._id, {
        status: req.body.status,
        });

        return res.status(200).json({ event: updated });
    } catch (err) {
        next(err);
    }
}
