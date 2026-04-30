import { Preference, Payment } from "mercadopago";
import { mpClient } from "../libs/mercadoPago.js";

export async function createCheckoutPreference({ order, event }) {
    const preference = new Preference(mpClient);

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
        notification_url: `${process.env.APP_URL}/api/payments/webhook`,
        back_urls: {
            success: `${process.env.CLIENT_URL}/payment/success`,
            failure: `${process.env.CLIENT_URL}/payment/failure`,
            pending: `${process.env.CLIENT_URL}/payment/pending`,
        },
        auto_return: "approved",
    };

    console.log("BODY MP:", JSON.stringify(body, null, 2));

    const response = await preference.create({ body });

    return response;
}

/**
 * Obtenemos el detalle del pago a través de su ID. Esto es útil para verificar el estado del pago después de que el usuario haya sido redirigido de vuelta a nuestro sitio.
 * @param {*} paymentId 
 * @returns 
 */
export async function getPaymentById(paymentId) {
    const payment = new Payment(mpClient);
    const response = await payment.get({ id: paymentId });
    return response;
}