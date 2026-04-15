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

export default router;