import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

import { findOrderById, updateOrderById } from "./order.service.js";
import { createManyTickets } from "./ticket.service.js";

import User from "../models/user.model.js";
import Event from "../models/event.model.js";
import TicketType from "../models/ticketType.model.js";

import { sendEmail } from "../libs/mailer.js";
import { orderConfirmedEmail } from "../emails/orderConfirmed.email.js";

export async function confirmPaidOrder(orderId, paymentData = {}) {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const order = await findOrderById(orderId, session);

    if (!order) {
      await session.abortTransaction();
      throw Object.assign(new Error("Order not found"), { status: 404 });
    }

    if (order.status === "PAID") {
      await session.commitTransaction();
      return order;
    }

    if (order.status !== "PENDING") {
      await session.abortTransaction();
      throw Object.assign(new Error("Order is not pending"), { status: 400 });
    }

    if (order.expiresAt && new Date() > new Date(order.expiresAt)) {
      await updateOrderById(order._id, { status: "EXPIRED" }, session);
      await session.commitTransaction();
      throw Object.assign(new Error("Order expired"), { status: 400 });
    }

    for (const item of order.items) {
      const qty = item.qty;

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
        throw Object.assign(new Error("Not enough stock to confirm order"), {
          status: 409,
        });
      }
    }

    const paidOrder = await updateOrderById(
      order._id,
      {
        status: "PAID",
        paidAt: new Date(),
        paymentProvider: paymentData.paymentProvider || "MERCADO_PAGO",
        paymentRef: paymentData.paymentId || null,
      },
      session
    );

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

    await createManyTickets(ticketsToCreate, session);

    await session.commitTransaction();

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

      await sendEmail({
        to: buyer.email,
        subject: `Confirmación de compra - ${event?.title || "Evento"}`,
        html,
      });
    } catch (e) {
      console.error("EMAIL_SEND_FAILED", e.message);
    }

    return paidOrder;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}


/**
 * 
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

import { findOrderById, updateOrderById } from "./order.service.js";
import { createManyTickets } from "./ticket.service.js";

import User from "../models/user.model.js";
import Event from "../models/event.model.js";
import TicketType from "../models/ticketType.model.js";

import { sendEmail } from "../libs/mailer.js";
import { orderConfirmedEmail } from "../emails/orderConfirmed.email.js";


Qué hace este service

Este nuevo service:

- busca la orden
- valida que exista
- valida que esté PENDING
- valida expiración
- descuenta stock
- marca PAID
- crea tickets
- manda email

O sea: es tu confirmación real, pero ahora separada del controller.
 * @param {*} orderId 
 * @returns 

export async function confirmPaidOrder(orderId) {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const order = await findOrderById(orderId, session);

    if (!order) {
      await session.abortTransaction();
      throw Object.assign(new Error("Order not found"), { status: 404 });
    }

    if (order.status !== "PENDING") {
      await session.abortTransaction();
      throw Object.assign(new Error("Order is not pending"), { status: 400 });
    }

    if (order.expiresAt && new Date() > new Date(order.expiresAt)) {
      await updateOrderById(order._id, { status: "EXPIRED" }, session);
      await session.commitTransaction();
      throw Object.assign(new Error("Order expired"), { status: 400 });
    }

    // 1) Descontar stock de forma atómica
    for (const item of order.items) {
      const qty = item.qty;

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
        throw Object.assign(new Error("Not enough stock to confirm order"), {
          status: 409,
        });
      }
    }

    // 2) Marcar orden como pagada
    const paidOrder = await updateOrderById(
      order._id,
      {
        status: "PAID",
        paidAt: new Date(),
      },
      session
    );

    // 3) Crear tickets
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

    await createManyTickets(ticketsToCreate, session);

    await session.commitTransaction();

    // 4) Enviar email fuera de la transacción
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

    return paidOrder;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}
*/