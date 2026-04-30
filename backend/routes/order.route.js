import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createOrderSchema, confirmOrderSchema } from "../schemas/order.schema.js";
import * as orderController from "../controllers/order.controller.js";
import { requireOrderOwner } from "../middlewares/orderOwner.middleware.js";

const router = Router();

// BUYER crea orden
router.post(
    "/orders",
    requireAuth,
    requireRole("BUYER"),
    validate(createOrderSchema),
    orderController.create
);

// BUYER ve sus órdenes
router.get(
    "/orders/me",
    requireAuth,
    requireRole("BUYER"),
    orderController.listMine
);

router.get(
    "/orders/:id",
    requireAuth,
    requireRole("BUYER"),
    requireOrderOwner,
    orderController.getOne
);

// Confirmación MVP (BUYER owner)
router.post(
    "/orders/:id/confirm",
    requireAuth,
    requireRole("BUYER"),
    requireOrderOwner,
    validate(confirmOrderSchema),
    orderController.confirm
);

export default router;
