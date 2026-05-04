import { findOrderById} from "../services/order.service.js";
import { findEventById } from "../services/event.service.js";
import { confirmPaidOrder } from "../services/orderConfirmation.service.js";
import { verifyMercadoPagoWebhookSignature } from "../libs/mercadoPagoWebhook.js";
import User from "../models/user.model.js";
import {
    buildMercadoPagoAuthUrl,
    exchangeCodeForToken,
} from "../services/mercadoPagoOAuth.service.js";

import {
    createCheckoutPreference,
    getPaymentById,
    findOrganizerByMercadoPagoUserId,
} from "../services/payment.service.js";
/**
 * 
Que hace esta funcion controller:
- recibe orderId
- busca la orden
- verifica que exista
- verifica que sea del usuario autenticado
- verifica que siga PENDING
- verifica que no haya expirado
- busca el evento
- llama al service de pago
- devuelve el init_point: es la URL de pago de Mercado Pago. (Produccion)
- devuelve el sandbox_init_point: es la URL de pago de Mercado Pago en modo sandbox (pruebas).
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
export async function createPreference(req, res, next) {
    try {
        const { orderId } = req.body;

        const order = await findOrderById(orderId);

        if (!order) {
        return res.status(404).json({ message: "Order not found" });
        }

        if (order.userId.toString() !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
        }

        if (order.status !== "PENDING") {
        return res.status(400).json({ message: "Order is not pending" });
        }

        if (order.expiresAt && new Date() > new Date(order.expiresAt)) {
        return res.status(400).json({ message: "Order expired" });
        }

        const event = await findEventById(order.eventId);

        if (!event) {
        return res.status(404).json({ message: "Event not found" });
        }

        const preference = await createCheckoutPreference({ order, event });

        return res.status(200).json({
        preferenceId: preference.id,
        initPoint: preference.init_point,
        sandboxInitPoint: preference.sandbox_init_point,
        });
    } catch (err) {
        next(err);
    }
}


export async function webhook(req, res, next) {
    try {
        console.log("WEBHOOK BODY:", req.body);
        console.log("WEBHOOK QUERY:", req.query);
        console.log("X-SIGNATURE:", req.headers["x-signature"]);
        console.log("X-REQUEST-ID:", req.headers["x-request-id"]);

        const signatureCheck = verifyMercadoPagoWebhookSignature(req);

        console.log("WEBHOOK SIGNATURE CHECK:", signatureCheck);

        if (!signatureCheck.ok) {
            console.warn("INVALID WEBHOOK SIGNATURE:", signatureCheck);

            if (process.env.NODE_ENV === "production") {
                return res.status(401).json({
                    message: "Invalid webhook signature",
                    reason: signatureCheck.reason,
                });
            }
        }

        const type = req.query.type || req.body?.type;
        const paymentId =
            req.query["data.id"] ||
            req.body?.data?.id ||
            req.query.id;

        if (type !== "payment" || !paymentId) {
            return res.sendStatus(200);
        }

        const mpUserId = req.body?.user_id?.toString();

        if (!mpUserId) {
            console.warn("Webhook missing Mercado Pago user_id");
            return res.sendStatus(200);
        }

        const organizer = await findOrganizerByMercadoPagoUserId(mpUserId);

        if (!organizer) {
            console.warn("Organizer not found for Mercado Pago user_id:", mpUserId);
            return res.sendStatus(200);
        }

        if (!organizer.mercadoPago?.accessToken) {
            console.warn("Organizer has no Mercado Pago access token");
            return res.sendStatus(200);
        }

        const payment = await getPaymentById(
            paymentId,
            organizer.mercadoPago.accessToken
        );

        console.log("PAYMENT FROM MP:", payment);

        if (payment.status !== "approved") {
            return res.sendStatus(200);
        }

        const orderId = payment.external_reference;

        if (!orderId) {
            console.warn("Payment missing external_reference");
            return res.sendStatus(200);
        }

        const order = await findOrderById(orderId);

        if (!order) {
            console.warn("Order not found:", orderId);
            return res.sendStatus(200);
        }

        if (order.status === "PAID") {
            return res.sendStatus(200);
        }

        const event = await findEventById(order.eventId);

        if (!event) {
            console.warn("Event not found for order:", orderId);
            return res.sendStatus(200);
        }

        if (event.organizerId.toString() !== organizer._id.toString()) {
            console.warn("Payment organizer does not match event organizer");
            return res.sendStatus(200);
        }

        await confirmPaidOrder(orderId, {
            paymentId: payment.id?.toString(),
            paymentProvider: "MERCADO_PAGO",
        });

        return res.sendStatus(200);
    } catch (err) {
        next(err);
    }
}


export async function connectMercadoPago(req, res, next) {
    try {
        if (req.user.role !== "ORGANIZER") {
            return res.status(403).json({
                message: "Only organizers can connect Mercado Pago",
            });
        }

        const authUrl = buildMercadoPagoAuthUrl(req.user.id);

        return res.status(200).json({
            authUrl,
        });
    } catch (err) {
        next(err);
    }
}

export async function mercadoPagoCallback(req, res, next) {
    try {
        const { code, state } = req.query;

        if (!code || !state) {
            return res.status(400).json({
                message: "Missing code or state",
            });
        }

        const user = await User.findById(state);

        if (!user) {
            return res.status(404).json({
                message: "Organizer not found",
            });
        }

        if (user.role !== "ORGANIZER") {
            return res.status(403).json({
                message: "User is not an organizer",
            });
        }

        const tokenData = await exchangeCodeForToken(code);

        user.mercadoPago = {
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            publicKey: tokenData.public_key,
            mpUserId: tokenData.user_id?.toString(),
            tokenType: tokenData.token_type,
            expiresIn: tokenData.expires_in,
            connectedAt: new Date(),
        };

        await user.save();

        return res.redirect(`${process.env.CLIENT_URL}/organizer/settings/payments?mp=connected`);
    } catch (err) {
        next(err);
    }
}

export async function mercadoPagoStatus(req, res, next) {
    try {
        const user = await User.findById(req.user.id).select("mercadoPago role");

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        if (user.role !== "ORGANIZER") {
            return res.status(403).json({
                message: "Only organizers can check Mercado Pago status",
            });
        }

        const connected = Boolean(
            user.mercadoPago?.accessToken &&
            user.mercadoPago?.refreshToken &&
            user.mercadoPago?.mpUserId
        );

        return res.status(200).json({
            connected,
            mpUserId: user.mercadoPago?.mpUserId || null,
            connectedAt: user.mercadoPago?.connectedAt || null,
        });
    } catch (err) {
        next(err);
    }
}