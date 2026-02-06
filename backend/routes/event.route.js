import { Router } from "express";
import * as eventController from "../controllers/event.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
    createEventSchema,
    updateEventSchema,
    updateEventStatusSchema,
} from "../schemas/event.schema.js";
import { requireEventOwner } from "../middlewares/eventOwner.middleware.js";
import { summary } from "../controllers/event.controller.js";
const router = Router();

// Público (solo publicados)
router.get("/events", eventController.listPublished);

// Organizer
router.post(
    "/events",
    requireAuth,
    requireRole("ORGANIZER"),
    validate(createEventSchema),
    eventController.create
);

router.get(
    "/events/me",
    requireAuth,
    requireRole("ORGANIZER"),
    eventController.listMine
);


// EVENT SUMMARY FOR DASHBOARD
// devuelve el resumen de todos los eventos del organizer
router.get(
    "/events/me/summary",
    requireAuth,
    requireRole("ORGANIZER"),
    eventController.mySummary
);
router.get("/events/:id", eventController.getById);
// Resumen de un evento (organizer only)
router.get(
    "/events/:id/summary",
    requireAuth,
    requireRole("ORGANIZER"),
    requireEventOwner,
    summary
);
// Actualizar evento
router.patch(
    "/events/:id",
    requireAuth,
    requireRole("ORGANIZER"),
    requireEventOwner,
    validate(updateEventSchema),
    eventController.update
);
// Listar tipos de tickets públicos de un evento
router.get(
    "/events/:id/ticket-types", 
    eventController.listTicketTypesPublic);

// Cambiar status de un evento
router.patch(
    "/events/:id/status",
    requireAuth,
    requireRole("ORGANIZER"),
    requireEventOwner,
    validate(updateEventStatusSchema),
    eventController.updateStatus
);

// Cancelar orden de un evento
router.post(
    "/events/:id/orders/:orderId/cancel",
    requireAuth,
    requireRole("ORGANIZER"),
    requireEventOwner,
    eventController.cancelEventOrder
);

// Event Management (Orders + Tickets)
// Listar órdenes de un evento
router.get(
    "/events/:id/orders",
    requireAuth,
    requireRole("ORGANIZER"),
    requireEventOwner,
    eventController.listOrders
    );
// Listar tickets de un evento
router.get(
    "/events/:id/tickets",
    requireAuth,
    requireRole("ORGANIZER"),
    requireEventOwner,
    eventController.listTickets
);
// Anular un ticket de un evento
router.post(
    "/events/:id/tickets/:ticketId/void",
    requireAuth,
    requireRole("ORGANIZER"),
    requireEventOwner,
    eventController.voidEventTicket
);
// Reintegrar un ticket de un evento
router.post(
    "/events/:id/tickets/:ticketId/reinstate",
    requireAuth,
    requireRole("ORGANIZER"),
    requireEventOwner,
    eventController.reinstateEventTicket
);

router.get(
    "/events/:id/orders/export.csv",
    requireAuth,
    requireRole("ORGANIZER"),
    requireEventOwner,
    eventController.exportOrdersCsv
    );

router.get(
    "/events/:id/tickets/export.csv",
    requireAuth,
    requireRole("ORGANIZER"),
    requireEventOwner,
    eventController.exportTicketsCsv
);

export default router;
