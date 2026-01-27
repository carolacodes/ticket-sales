import { findEventById } from "../services/event.service.js";

export const requireEventOwner = async (req, res, next) => {
    try {
        const { id } = req.params; // /events/:id
        const event = await findEventById(id);

        if (!event) return res.status(404).json({ message: "Event not found" });

        // Guardamos el evento en req para no volver a consultarlo en el controller
        req.event = event;

        // El organizer autenticado debe ser el dueño del evento
        if (event.organizerId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Forbidden" });
        }

        next();
    } catch (err) {
        next(err);
    }
};
