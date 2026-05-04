import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";
import * as paymentController from "../controllers/payment.controller.js";

const router = Router();

router.post(
    "/payments/create-preference",
    requireAuth,
    requireRole("BUYER"),
    paymentController.createPreference
);

router.post(
    "/payments/webhook",
    paymentController.webhook
);

router.get("/payments/webhook", (req, res) => {
    return res.status(200).send("Webhook OK");
});

router.get(
    "/payments/mercadopago/connect",
    requireAuth,
    requireRole("ORGANIZER"),
    paymentController.connectMercadoPago
);

router.get(
    "/payments/mercadopago/callback",
    paymentController.mercadoPagoCallback
);

router.get(
    "/payments/mercadopago/status",
    requireAuth,
    requireRole("ORGANIZER"),
    paymentController.mercadoPagoStatus
);
export default router;