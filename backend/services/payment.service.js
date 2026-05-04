import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import User from "../models/user.model.js";
import { refreshMercadoPagoAccessToken } from "./mercadoPagoOAuth.service.js";
function createMpClient(accessToken) {
    return new MercadoPagoConfig({
        accessToken,
    });
}

export async function createCheckoutPreference({ order, event }) {
    const organizer = await User.findById(event.organizerId);

    if (!organizer) {
        throw new Error("Organizer not found");
    }

    if (!organizer.mercadoPago?.accessToken) {
        throw new Error("Organizer has not connected Mercado Pago");
    }

    const organizerMpClient = createMpClient(organizer.mercadoPago.accessToken);
    const preference = new Preference(organizerMpClient);

    const body = {
        items: [
            {
                title: event.title || "Entrada",
                quantity: 1,
                unit_price: Number(order.total),
                currency_id: "ARS",
            },
        ],

        external_reference: order._id.toString(),

        metadata: {
            order_id: order._id.toString(),
            event_id: event._id.toString(),
            organizer_id: event.organizerId.toString(),
        },

        notification_url: `${process.env.APP_URL}/api/payments/webhook`,

        back_urls: {
            success: `${process.env.CLIENT_URL}/payment/success`,
            failure: `${process.env.CLIENT_URL}/payment/failure`,
            pending: `${process.env.CLIENT_URL}/payment/pending`,
        },

        auto_return: "approved",

        // Opcional: comisión de tu plataforma
        // marketplace_fee: Math.round(Number(order.total) * 0.1),
    };

    console.log("BODY MP:", JSON.stringify(body, null, 2));

    let response;

    try {
        response = await preference.create({ body });
    } catch (error) {
        console.warn("MP create preference error");

        // 🔥 si el token expiró → lo renovamos
        if (
            error?.message?.includes("401") ||
            error?.message?.toLowerCase().includes("unauthorized")
        ) {
            console.log("Refreshing Mercado Pago token...");

            const tokenData = await refreshMercadoPagoAccessToken(
                organizer.mercadoPago.refreshToken
            );

            // 🔥 actualizamos usuario
            organizer.mercadoPago.accessToken = tokenData.access_token;
            organizer.mercadoPago.refreshToken = tokenData.refresh_token;
            organizer.mercadoPago.expiresIn = tokenData.expires_in;
            organizer.mercadoPago.connectedAt = new Date();

            await organizer.save();

            // 🔥 reintentamos con nuevo token
            const newClient = createMpClient(tokenData.access_token);
            const newPreference = new Preference(newClient);

            response = await newPreference.create({ body });
        } else {
            throw error;
        }
    }

    return response;
}

export async function getPaymentById(paymentId, accessToken) {
    const mpClient = createMpClient(accessToken);
    const payment = new Payment(mpClient);

    const response = await payment.get({ id: paymentId });

    return response;
}

export async function findOrganizerByMercadoPagoUserId(mpUserId) {
    return User.findOne({
        role: "ORGANIZER",
        "mercadoPago.mpUserId": mpUserId?.toString(),
    });
}