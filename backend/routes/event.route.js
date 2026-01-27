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

const router = Router();

// Público (solo publicados)
router.get("/events", eventController.listPublished);
router.get("/events/:id", eventController.getById);

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

router.patch(
    "/events/:id",
    requireAuth,
    requireRole("ORGANIZER"),
    requireEventOwner,
    validate(updateEventSchema),
    eventController.update
);

router.patch(
    "/events/:id/status",
    requireAuth,
    requireRole("ORGANIZER"),
    requireEventOwner,
    validate(updateEventStatusSchema),
    eventController.updateStatus
);

export default router;
