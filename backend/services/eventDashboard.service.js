import mongoose from "mongoose";
import Event from "../models/event.model.js";
import Order from "../models/order.model.js";

export async function getOrganizerDashboardSummary(organizerId) {
    const orgId = new mongoose.Types.ObjectId(organizerId);

    // 1) Traer eventos del organizer
    const events = await Event.find({ organizerId: orgId })
        .sort({ createdAt: -1 })
        .select("_id title status startAt endAt createdAt");

    if (events.length === 0) {
        return {
        totals: {
            totalRevenuePaid: 0,
            totalTicketsSoldPaid: 0,
            ordersPaid: 0,
            ordersPending: 0,
            ordersCanceled: 0,
            ordersExpired: 0,
            avgOrderValuePaid: 0,
        },
        events: [],
        };
    }

    const eventIds = events.map((e) => e._id);

    // 2) Orders agrupadas por evento y status (counts + revenuePaid)
    const ordersByEventStatus = await Order.aggregate([
        { $match: { eventId: { $in: eventIds } } },
        {
        $group: {
            _id: { eventId: "$eventId", status: "$status" },
            count: { $sum: 1 },
            revenuePaid: {
            $sum: {
                $cond: [{ $eq: ["$status", "PAID"] }, "$total", 0],
            },
            },
        },
        },
    ]);

    // 3) Tickets vendidos + revenue por items SOLO de órdenes PAID (por evento)
    // (tu Order guarda items.qty + items.unitPrice => perfecto)
    const paidItemsByEvent = await Order.aggregate([
        { $match: { eventId: { $in: eventIds }, status: "PAID" } },
        { $unwind: "$items" },
        {
        $group: {
            _id: "$eventId",
            totalTicketsSoldPaid: { $sum: "$items.qty" },
            totalRevenuePaidFromItems: {
            $sum: { $multiply: ["$items.qty", "$items.unitPrice"] },
            },
        },
        },
    ]);

    // ---- Merge en JS (más simple de mantener) ----
    const statusMap = new Map(); // key: eventId -> { PAID:{count,revenue}, ... }
    for (const row of ordersByEventStatus) {
        const eid = row._id.eventId.toString();
        const st = row._id.status;
        if (!statusMap.has(eid)) statusMap.set(eid, {});
        statusMap.get(eid)[st] = { count: row.count, revenue: row.revenuePaid };
    }

    const paidItemsMap = new Map(); // key: eventId -> {ticketsSold, revenueItems}
    for (const row of paidItemsByEvent) {
        paidItemsMap.set(row._id.toString(), {
        ticketsSold: row.totalTicketsSoldPaid,
        revenueItems: row.totalRevenuePaidFromItems,
        });
    }

    let totals = {
        totalRevenuePaid: 0,
        totalTicketsSoldPaid: 0,
        ordersPaid: 0,
        ordersPending: 0,
        ordersCanceled: 0,
        ordersExpired: 0,
        avgOrderValuePaid: 0,
    };

    const eventsSummary = events.map((e) => {
        const eid = e._id.toString();
        const byStatus = statusMap.get(eid) || {};

        const ordersPaid = byStatus.PAID?.count || 0;
        const ordersPending = byStatus.PENDING?.count || 0;
        const ordersCanceled = byStatus.CANCELED?.count || 0;
        const ordersExpired = byStatus.EXPIRED?.count || 0;

        // Revenue: preferimos el revenue por items (más exacto si en el futuro hay descuentos)
        const paidAgg = paidItemsMap.get(eid) || { ticketsSold: 0, revenueItems: 0 };
        const totalRevenuePaid = paidAgg.revenueItems || byStatus.PAID?.revenue || 0;

        const totalTicketsSoldPaid = paidAgg.ticketsSold || 0;
        const avgOrderValuePaid = ordersPaid > 0 ? totalRevenuePaid / ordersPaid : 0;

        // acumular totales globales
        totals.totalRevenuePaid += totalRevenuePaid;
        totals.totalTicketsSoldPaid += totalTicketsSoldPaid;
        totals.ordersPaid += ordersPaid;
        totals.ordersPending += ordersPending;
        totals.ordersCanceled += ordersCanceled;
        totals.ordersExpired += ordersExpired;

        return {
        event: {
            id: e._id,
            title: e.title,
            status: e.status,
            startAt: e.startAt,
            endAt: e.endAt || null,
            createdAt: e.createdAt,
        },
        kpis: {
            totalRevenuePaid,
            totalTicketsSoldPaid,
            ordersPaid,
            ordersPending,
            ordersCanceled,
            ordersExpired,
            avgOrderValuePaid,
        },
        };
    });

    totals.avgOrderValuePaid = totals.ordersPaid > 0 ? totals.totalRevenuePaid / totals.ordersPaid : 0;

    return { totals, events: eventsSummary };
}
