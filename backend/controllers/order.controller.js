import mongoose from "mongoose";
import { createOrder, findOrdersByUserId, findOrderById, updateOrderById } from "../services/order.service.js";
import { findEventById } from "../services/event.service.js";
//import TicketType from "../models/ticketType.model.js"; // usamos el model directo para query con sesión
import { v4 as uuidv4 } from "uuid";
import { createManyTickets } from "../services/ticket.service.js";
import User from "../models/user.model.js";
import Event from "../models/event.model.js";
import TicketType from "../models/ticketType.model.js";
import { sendEmail } from "../libs/mailer.js";
import { orderConfirmedEmail } from "../emails/orderConfirmed.email.js";
import { confirmPaidOrder } from "../services/orderConfirmation.service.js";

export async function create(req, res, next) {
    try {
        const userId = req.user.id;
        const { eventId, items } = req.body;

        const event = await findEventById(eventId);
        if (!event) return res.status(404).json({ message: "Event not found" });
        if (event.status !== "PUBLISHED") return res.status(403).json({ message: "Event not available" });

        // Traer todos los ticket types pedidos
        const ids = items.map((i) => i.ticketTypeId);
        const ticketTypes = await TicketType.find({ _id: { $in: ids }, eventId });

        if (ticketTypes.length !== ids.length) {
        return res.status(400).json({ message: "Some ticket types are invalid for this event" });
        }

        // Map para lookup rápido
        const ttMap = new Map(ticketTypes.map((t) => [t._id.toString(), t]));

        // Validar stock + calcular total
        let total = 0;
        let currency = ticketTypes[0].currency || "USD";

        const orderItems = items.map((i) => {
        const tt = ttMap.get(i.ticketTypeId);
        const available = (tt.capacity ?? 0) - (tt.soldCount ?? 0);

        // opcional: validar ventana de venta
        if (tt.saleStartAt && new Date() < new Date(tt.saleStartAt)) {
            throw Object.assign(new Error("Sale has not started"), { status: 400 });
        }
        if (tt.saleEndAt && new Date() > new Date(tt.saleEndAt)) {
            throw Object.assign(new Error("Sale has ended"), { status: 400 });
        }

        if (i.qty > available) {
            throw Object.assign(new Error(`Not enough stock for ${tt.name}`), { status: 409 });
        }

        const lineTotal = tt.price * i.qty;
        total += lineTotal;

        return {
            ticketTypeId: tt._id,
            name: tt.name,
            unitPrice: tt.price,
            currency: tt.currency || currency,
            qty: i.qty,
            lineTotal,
        };
    });

    // Expiración opcional para PENDING (ej: 15 min)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const order = await createOrder({
        userId,
        eventId,
        status: "PENDING",
        items: orderItems,
        total,
        currency,
        expiresAt,
    });

    return res.status(201).json({ order });
    } catch (err) {
        next(err);
    }
}

export async function listMine(req, res, next) {
    try {
        const orders = await findOrdersByUserId(req.user.id);
        return res.status(200).json({ orders });
    } catch (err) {
        next(err);
    }
}

/**
 * Confirmación "fake" (MVP):
 * - verifica order PENDING
 * - descuenta stock (incrementa soldCount) de manera atómica
 * - marca order como PAID
 * - (más adelante) emite tickets

export async function confirm(req, res, next) {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const order = await findOrderById(req.params.id, session);
    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Order not found" });
    }

    // Owner-only (si ya usaste requireOrderOwner, esto es redundante)
    if (order.userId.toString() !== req.user.id) {
      await session.abortTransaction();
      return res.status(403).json({ message: "Forbidden" });
    }

    if (order.status !== "PENDING") {
      await session.abortTransaction();
      return res.status(400).json({ message: "Order is not pending" });
    }

    // Si expira
    if (order.expiresAt && new Date() > new Date(order.expiresAt)) {
      await updateOrderById(order._id, { status: "EXPIRED" }, session);
      await session.commitTransaction();
      return res.status(400).json({ message: "Order expired" });
    }

    // 1) Descontar stock de cada ticketType de forma segura
    for (const item of order.items) {
      const qty = item.qty;

      // filtro con $expr: soldCount + qty <= capacity
      const updated = await TicketType.findOneAndUpdate(
        {
          _id: item.ticketTypeId,
          eventId: order.eventId,
          $expr: { $lte: [{ $add: ["$soldCount", qty] }, "$capacity"] },
        },
        { $inc: { soldCount: qty } },
        { new: true, session }
      );

      if (!updated) {
        await session.abortTransaction();
        return res.status(409).json({ message: "Not enough stock to confirm order" });
      }
    }

    // 2) Marcar orden como pagada
    const paidOrder = await updateOrderById(
      order._id,
      { status: "PAID", paidAt: new Date() },
      session
    );

    // 3) Crear tickets (uno por unidad)
    const ticketsToCreate = [];

    for (const item of order.items) {
      for (let i = 0; i < item.qty; i++) {
        ticketsToCreate.push({
          orderId: order._id,
          eventId: order.eventId,
          ticketTypeId: item.ticketTypeId,
          userId: order.userId,
          code: uuidv4(),
          status: "VALID",
          checkedInAt: null,
        });
      }
    }

    // insertMany en la misma transacción
    await createManyTickets(ticketsToCreate, session);

    await session.commitTransaction();

    // ✅ Email fuera de la transacción
    try {
      const [buyer, event, ticketTypes] = await Promise.all([
        User.findById(order.userId).select("email username"),
        Event.findById(order.eventId).select("title"),
        TicketType.find({
          _id: { $in: order.items.map((i) => i.ticketTypeId) },
        }).select("name"),
      ]);

      if (!buyer?.email) {
        throw new Error("Buyer email not found");
      }

      // Map ticketTypeId -> name
      const ttMap = new Map(ticketTypes.map((tt) => [tt._id.toString(), tt.name]));

      const emailTickets = ticketsToCreate.map((t) => ({
        code: t.code,
        ticketTypeName: ttMap.get(t.ticketTypeId.toString()) || "Ticket",
      }));

      const html = orderConfirmedEmail({
        eventTitle: event?.title || "Evento",
        orderId: paidOrder._id.toString(),
        buyerUsername: buyer?.username || "",
        tickets: emailTickets,
      });

      const sent = await sendEmail({
        to: buyer.email,
        subject: `Confirmación de compra - ${event?.title || "Evento"}`,
        html,
      });

      console.log("EMAIL_SENT", sent?.id);
    } catch (e) {
      console.error("EMAIL_SEND_FAILED", e.message);
    }

    return res.status(200).json({ order: paidOrder });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
}
 */

/**
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
export async function confirm(req, res, next) {
  try {
    const order = await findOrderById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const paidOrder = await confirmPaidOrder(order._id);

    return res.status(200).json({ order: paidOrder });
  } catch (err) {
    next(err);
  }
}