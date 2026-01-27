import { Router } from "express";
import * as ticketTypeController from "../controllers/ticketType.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
    createTicketTypeSchema,
    updateTicketTypeSchema,
} from "../schemas/ticketType.schema.js";
import { requireTicketTypeOwner } from "../middlewares/ticketTypeOwner.middleware.js";

const router = Router();

// Público si evento está PUBLISHED.
// Para soportar "owner view" de eventos DRAFT, hacemos auth opcional:
router.get("/events/:eventId/ticket-types", ticketTypeController.listByEvent);

// Crear ticket types -> organizer dueño
router.post(
    "/events/:eventId/ticket-types",
    requireAuth,
    requireRole("ORGANIZER"),
    validate(createTicketTypeSchema),
    ticketTypeController.create
);

// Editar ticket type -> organizer dueño
router.patch(
    "/ticket-types/:id",
    requireAuth,
    requireRole("ORGANIZER"),
    requireTicketTypeOwner,
    validate(updateTicketTypeSchema),
    ticketTypeController.update
);

// Eliminar ticket type -> organizer dueño
router.delete(
    "/ticket-types/:id",
    requireAuth,
    requireRole("ORGANIZER"),
    requireTicketTypeOwner,
    ticketTypeController.remove
);

export default router;
