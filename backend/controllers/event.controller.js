import {
    createEvent,
    findPublishedEvents,
    findEventById,
    findEventsByOrganizerId,
    updateEventById,
    listPublishedEventsCatalog,
} from "../services/event.service.js";
import { getEventSummary } from "../services/eventSummary.service.js";
import { getOrganizerDashboardSummary } from "../services/eventDashboard.service.js";
import { findEventOrders, findEventTickets } from "../services/eventManagement.service.js";
import { findOrderById, cancelOrderById } from "../services/orderManagement.service.js";
import Order from "../models/order.model.js";
import { findTicketById, reinstateTicketById , voidTicketById} from "../services/ticketManagement.service.js";
import { exportEventOrders, exportEventTickets } from "../services/eventExport.service.js";
import Event from "../models/event.model.js"; 
// controllers/event.controller.js
import cloudinary from "../config/cloudinary.js";
//import { findEventById } from "../services/event.service.js";
import { findTicketTypesByEventId } from "../services/ticketType.service.js";
export async function create(req, res, next) {
    try {
        // req.user viene del middleware requireAuth
        const organizerId = req.user.id;

        const event = await createEvent({
        ...req.body,
        organizerId,
        status: "DRAFT", // default controlado acá (no confiamos en el client)
        });

        return res.status(201).json({ event });
    } catch (err) {
        next(err);
    }
}

export async function listPublished(req, res, next) {
    try {
        const events = await findPublishedEvents();
        return res.status(200).json({ events });
    } catch (err) {
        next(err);
    }
}

export async function getById(req, res, next) {
    try {
        const event = await findEventById(req.params.id);
        if (!event) return res.status(404).json({ message: "Event not found" });

        // Regla simple:
        // - si está publicado, cualquiera lo puede ver
        // - si NO está publicado, solo el owner lo puede ver
        if (event.status !== "PUBLISHED") {
        if (!req.user) return res.status(403).json({ message: "Forbidden" });
        if (event.organizerId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Forbidden" });
        }
        }

        return res.status(200).json({ event });
    } catch (err) {
        next(err);
    }
}

export async function listMine(req, res, next) {
    try {
        const events = await findEventsByOrganizerId(req.user.id);
        return res.status(200).json({ events });
    } catch (err) {
        next(err);
    }
}

export async function update(req, res, next) {
    try {
        // req.event lo setea requireEventOwner
        const updated = await updateEventById(req.event._id, req.body);
        return res.status(200).json({ event: updated });
    } catch (err) {
        next(err);
    }
}

export async function updateStatus(req, res, next) {
    try {
        // req.event lo setea requireEventOwner
        const updated = await updateEventById(req.event._id, {
        status: req.body.status,
        });

        return res.status(200).json({ event: updated });
    } catch (err) {
        next(err);
    }
}

//EVENT SUMMARY FOR DASHBOARD
// devuelve el resumen de un evento específico
export async function summary(req, res, next) {
    try {
        // req.event viene de requireEventOwner
        const result = await getEventSummary(req.event._id.toString());

        return res.status(200).json({
        event: {
            id: req.event._id,
            title: req.event.title,
            status: req.event.status,
            startAt: req.event.startAt,
            endAt: req.event.endAt || null,
        },
        ...result,
        });
    } catch (err) {
        next(err);
    }
}

//devuelve todos los eventos de un organizador con su resumen
export async function mySummary(req, res, next) {
    try {
        const result = await getOrganizerDashboardSummary(req.user.id);
        return res.status(200).json(result);
    } catch (err) {
        next(err);
    }
}

// DTO de orden
const orderDTO = (o) => ({
    id: o._id,
    status: o.status,
    total: o.total,
    paymentProvider: o.paymentProvider,
    paymentRef: o.paymentRef,
    expiresAt: o.expiresAt,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
    buyer: o.userId
        ? {
            id: o.userId._id,
            username: o.userId.username,
            email: o.userId.email,
            role: o.userId.role,
        }
        : null,
    items: o.items.map((it) => ({
        ticketTypeId: it.ticketTypeId,
        qty: it.qty,
        unitPrice: it.unitPrice,
    })),
});

// Parseo de query params page & limit
const parsePaging = (req) => {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "20", 10), 1), 100);
    return { page, limit };
};
// Listar órdenes de un evento
export async function listOrders(req, res, next) {
    try {
        // req.event viene de requireEventOwner
        const { page, limit } = parsePaging(req);

        const status = req.query.status; // PENDING | PAID | CANCELED | EXPIRED
        const from = req.query.from;     // ISO date
        const to = req.query.to;         // ISO date
        const q = (req.query.q || "").trim();
        const result = await findEventOrders(req.event._id, { status, from, to, page, limit, q });
        //const result = await findEventOrders(req.event._id, { status, from, to, page, limit });

        return res.status(200).json({
            event: { id: req.event._id, title: req.event.title },
            page,
            limit,
            total: result.total,
            orders: result.orders.map(orderDTO),
        });
    } catch (err) {
        next(err);
    }
}
// DTO de ticket
const ticketDTO = (t) => ({
    id: t._id,
    code: t.code,
    status: t.status,
    checkedInAt: t.checkedInAt,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    orderId: t.orderId,
    buyer: t.userId
        ? {
            id: t.userId._id,
            username: t.userId.username,
            email: t.userId.email,
        }
        : null,
    ticketType: t.ticketTypeId
        ? {
            id: t.ticketTypeId._id,
            name: t.ticketTypeId.name,
            price: t.ticketTypeId.price,
        }
        : null,
});
// Listar tickets de un evento
export async function listTickets(req, res, next) {
    try {
        //const { page, limit } = parsePaging(req);

        //const status = req.query.status; // VALID | USED | VOID
        const q = (req.query.q || "").trim();
        const status = req.query.status;
        const { page, limit } = parsePaging(req);

        const result = await findEventTickets(req.event._id, { status, page, limit, q });
        //const result = await findEventTickets(req.event._id, { status, page, limit });

        return res.status(200).json({
            event: { id: req.event._id, title: req.event.title },
            page,
            limit,
            total: result.total,
            tickets: result.tickets.map(ticketDTO),
        });
    } catch (err) {
        next(err);
    }
}
// Anular una orden de un evento (PENDING -> CANCELED o EXPIRED)
export async function cancelEventOrder(req, res, next) {
    try {
        // req.event viene de requireEventOwner
        const { orderId } = req.params;

        const order = await findOrderById(orderId);
        if (!order) return res.status(404).json({ message: "Order not found" });

        // seguridad: que la order pertenezca a este evento
        if (order.eventId.toString() !== req.event._id.toString()) {
        return res.status(404).json({ message: "Order not found" });
        }

        // solo PENDING
        if (order.status !== "PENDING") {
        return res.status(400).json({ message: `Order is ${order.status}` });
        }

        // opcional: si ya expiró, marcar EXPIRED en vez de cancelar
        if (order.expiresAt && new Date() > new Date(order.expiresAt)) {
            const expired = await Order.findByIdAndUpdate(
                order._id,
                { status: "EXPIRED", expiredAt: new Date() },
                { new: true }
            );

            return res.status(200).json({ order: expired });
        }

        const canceled = await cancelOrderById(order._id);

        return res.status(200).json({ order: canceled });
    } catch (err) {
        next(err);
    }
}
// Anular un ticket de un evento (VALID -> VOID)
export async function voidEventTicket(req, res, next) {
    try {
        const { ticketId } = req.params;
        const { reason } = req.body || {};

        const ticket = await findTicketById(ticketId);
        if (!ticket) return res.status(404).json({ message: "Ticket not found" });

        // asegurar que pertenezca al evento
        if (ticket.eventId.toString() !== req.event._id.toString()) {
        return res.status(404).json({ message: "Ticket not found" });
        }

        if (ticket.status !== "VALID") {
        return res.status(400).json({ message: `Ticket is ${ticket.status}` });
        }

        const updated = await voidTicketById(ticket._id, { reason });

        return res.status(200).json({ ticket: updated });
    } catch (err) {
        next(err);
    }
}
// Reintegrar un ticket anulado (VOID -> VALID)
export async function reinstateEventTicket(req, res, next) {
    try {
        const { ticketId } = req.params;

        const ticket = await findTicketById(ticketId);
        if (!ticket) return res.status(404).json({ message: "Ticket not found" });

        if (ticket.eventId.toString() !== req.event._id.toString()) {
        return res.status(404).json({ message: "Ticket not found" });
        }

        if (ticket.status !== "VOID") {
        return res.status(400).json({ message: `Ticket is ${ticket.status}` });
        }

        const updated = await reinstateTicketById(ticket._id);
        return res.status(200).json({ ticket: updated });
    } catch (err) {
        next(err);
    }
}

// helpers CSV
const csvEscape = (v) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    // si contiene coma, comillas o salto de línea, hay que envolver en comillas y escapar comillas dobles
    if (/[,"\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
};

const toCsv = (headers, rows) => {
    const head = headers.map(csvEscape).join(",");
    const body = rows.map((r) => headers.map((h) => csvEscape(r[h])).join(",")).join("\n");
    return `${head}\n${body}\n`;
};
const iso = (d) => (d ? new Date(d).toISOString() : "");

export async function exportOrdersCsv(req, res, next) {
    try {
        const status = req.query.status;
        const from = req.query.from;
        const to = req.query.to;
        const q = (req.query.q || "").trim();

        const orders = await exportEventOrders(req.event._id, { status, from, to, q });

        // Aplanamos items para CSV (string simple)
        const rows = orders.map((o) => ({
        orderId: o._id,
        status: o.status,
        total: o.total,
        createdAt: iso(o.createdAt),
        updatedAt: iso(o.updatedAt),
        expiresAt: iso(o.expiresAt),
        buyerId: o.userId?._id || "",
        buyerUsername: o.userId?.username || "",
        buyerEmail: o.userId?.email || "",
        items: (o.items || [])
            .map((it) => `${it.ticketTypeId}:${it.qty}x${it.unitPrice}`)
            .join(" | "),
        }));

        const headers = [
        "orderId",
        "status",
        "total",
        "createdAt",
        "updatedAt",
        "expiresAt",
        "buyerId",
        "buyerUsername",
        "buyerEmail",
        "items",
        ];

        const csv = toCsv(headers, rows);

        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader(
        "Content-Disposition",
        `attachment; filename="event-${req.event._id}-orders.csv"`
        );

        return res.status(200).send(csv);
    } catch (err) {
        next(err);
    }
}

export async function exportTicketsCsv(req, res, next) {
    try {
        const status = req.query.status;
        const q = (req.query.q || "").trim();

        const tickets = await exportEventTickets(req.event._id, { status, q });

        const rows = tickets.map((t) => ({
        ticketId: t._id,
        code: t.code,
        status: t.status,
        createdAt: iso(t.createdAt),
        checkedInAt: iso(t.checkedInAt),
        voidedAt: iso(t.voidedAt),
        orderId: t.orderId || "",
        buyerId: t.userId?._id || "",
        buyerUsername: t.userId?.username || "",
        buyerEmail: t.userId?.email || "",
        ticketTypeId: t.ticketTypeId?._id || "",
        ticketTypeName: t.ticketTypeId?.name || "",
        ticketTypePrice: t.ticketTypeId?.price ?? "",
        voidedAt: iso(t.voidedAt),
        voidReason: t.voidReason || "",
        }));

        const headers = [
        "ticketId",
        "code",
        "status",
        "createdAt",
        "checkedInAt",
        "orderId",
        "buyerId",
        "buyerUsername",
        "buyerEmail",
        "ticketTypeId",
        "ticketTypeName",
        "ticketTypePrice",
        "voidedAt",
        "voidReason",
        ];

        const csv = toCsv(headers, rows);

        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="event-${req.event._id}-tickets.csv"`
        );

    return res.status(200).send(csv);
    } catch (err) {
        next(err);
    }
}

// Listar tipos de tickets públicos de un evento
export async function listTicketTypesPublic(req, res, next) {
    try {
        const event = await findEventById(req.params.id);
        if (!event) return res.status(404).json({ message: "Event not found" });

        // opcional: solo si está publicado
        if (event.status !== "PUBLISHED") {
        return res.status(404).json({ message: "Event not found" });
        }

        const ticketTypes = await findTicketTypesByEventId(event._id);

        return res.status(200).json({
        event: { id: event._id, title: event.title },
        ticketTypes: ticketTypes.map((t) => ({
            id: t._id,
            name: t.name,
            price: t.price,
            capacity: t.capacity,
            soldCount: t.soldCount,
            available: Math.max(0, t.capacity - t.soldCount),
        })),
        });
    } catch (err) {
        next(err);
    }
}


export async function uploadBanner(req, res) {
  try {
    const imageUrl = req.file?.path; // URL final
    const publicId = req.file?.filename; // Cloudinary public_id (multer-storage-cloudinary)

    if (!imageUrl || !publicId) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // ✅ borrar anterior (si existía)
    if (event.bannerPublicId) {
      await cloudinary.uploader.destroy(event.bannerPublicId);
    }

    event.bannerUrl = imageUrl;
    event.bannerPublicId = publicId;
    await event.save();

    return res.json({ event });
  } catch (err) {
    console.log("UPLOAD_BANNER_ERR", err);
    return res.status(500).json({ message: "Could not upload banner" });
  }
}


export async function listPublishedEvents(req, res, next) {
  try {
    const {
      q = "",
      tags = "",
      dateFrom = "",
      dateTo = "",
      minPrice = "",
      maxPrice = "",
      page = 1,
      limit = 12,
    } = req.query;

    const parsedTags = String(tags || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const result = await listPublishedEventsCatalog({
      q,
      tags: parsedTags,
      dateFrom,
      dateTo,
      minPrice,
      maxPrice,
      page,
      limit,
    });

    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}