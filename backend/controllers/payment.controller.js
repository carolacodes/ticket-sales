import { findOrderById} from "../services/order.service.js";
import { findEventById } from "../services/event.service.js";
import { createCheckoutPreference, getPaymentById } from "../services/payment.service.js";
import { confirmPaidOrder } from "../services/orderConfirmation.service.js";
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
    console.log("CONTENT-TYPE:", req.headers["content-type"]);
    
    const type = req.query.type || req.body?.type;
    const paymentId = req.query["data.id"] || req.body?.data?.id;

    if (type !== "payment" || !paymentId) {
      return res.sendStatus(200);
    }

    const payment = await getPaymentById(paymentId);

    console.log("PAYMENT FROM MP:", payment);

    if (payment.status !== "approved") {
      return res.sendStatus(200);
    }

    const orderId = payment.external_reference;
    if (!orderId) {
      return res.sendStatus(200);
    }

    const order = await findOrderById(orderId);
    if (!order) {
      return res.sendStatus(200);
    }

    if (order.status === "PAID") {
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