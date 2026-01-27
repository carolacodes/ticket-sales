import { Router } from "express";
import * as ticketController from "../controllers/ticket.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { checkInSchema } from "../schemas/ticket.schema.js";
import { requireTicketEventOwner } from "../middlewares/ticketCheckinOwner.middleware.js";

const router = Router();

// BUYER: ver mis tickets
router.get(
    "/tickets/me",
    requireAuth,
    requireRole("BUYER"),
    ticketController.listMine
);

// ORGANIZER: check-in por código
router.post(
    "/tickets/check-in",
    requireAuth,
    requireRole("ORGANIZER"),
    validate(checkInSchema),
    requireTicketEventOwner,
    ticketController.checkIn
);

export default router;
