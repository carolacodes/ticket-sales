import mongoose from "mongoose";
import Order from "../models/order.model.js";
import TicketType from "../models/ticketType.model.js";

export async function getEventSummary(eventId) {
    const _eventId = new mongoose.Types.ObjectId(eventId);

    // 1) KPIs por estado (counts + revenue PAID)
    const byStatusAgg = await Order.aggregate([
        { $match: { eventId: _eventId } },
        {
        $group: {
            _id: "$status",
            count: { $sum: 1 },
            revenue: {
            $sum: {
                $cond: [{ $eq: ["$status", "PAID"] }, "$total", 0],
            },
            },
        },
        },
    ]);

    const byStatus = byStatusAgg.reduce((acc, row) => {
        acc[row._id] = { count: row.count, revenue: row.revenue };
        return acc;
    }, {});

    // 2) Tickets vendidos + revenue por ticketType SOLO de órdenes PAID
    // (si tu Order items tiene unitPrice + qty)
    const paidItemsAgg = await Order.aggregate([
        { $match: { eventId: _eventId, status: "PAID" } },
        { $unwind: "$items" },
        {
        $group: {
            _id: "$items.ticketTypeId",
            ticketsSold: { $sum: "$items.qty" },
            revenue: { $sum: { $multiply: ["$items.qty", "$items.unitPrice"] } },
        },
        },
    ]);

    const salesByTicketType = new Map(
        paidItemsAgg.map((r) => [r._id.toString(), { ticketsSold: r.ticketsSold, revenue: r.revenue }])
    );

    // 3) Stock (capacity/soldCount) por ticketType desde la colección TicketType
    const ticketTypes = await TicketType.find({ eventId: _eventId }).sort({ createdAt: 1 });

    const ticketTypesSummary = ticketTypes.map((tt) => {
        const sales = salesByTicketType.get(tt._id.toString()) || { ticketsSold: 0, revenue: 0 };
        const capacity = tt.capacity ?? 0;
        const soldCount = tt.soldCount ?? 0;
        const remaining = Math.max(capacity - soldCount, 0);

        return {
        id: tt._id,
        name: tt.name,
        price: tt.price,
        currency: tt.currency || "USD",
        capacity,
        soldCount,
        remaining,
        ticketsSoldPaid: sales.ticketsSold,
        revenuePaid: sales.revenue,
        saleStartAt: tt.saleStartAt || null,
        saleEndAt: tt.saleEndAt || null,
        };
    });

    // 4) KPIs globales
    const ordersPaid = byStatus.PAID?.count || 0;
    const ordersPending = byStatus.PENDING?.count || 0;
    const ordersCanceled = byStatus.CANCELED?.count || 0;
    const ordersExpired = byStatus.EXPIRED?.count || 0;

    const totalRevenuePaid = byStatus.PAID?.revenue || 0;

    const totalTicketsSoldPaid = paidItemsAgg.reduce((sum, r) => sum + (r.ticketsSold || 0), 0);
    const avgOrderValuePaid = ordersPaid > 0 ? totalRevenuePaid / ordersPaid : 0;

    return {
        kpis: {
        totalRevenuePaid,
        totalTicketsSoldPaid,
        ordersPaid,
        ordersPending,
        ordersCanceled,
        ordersExpired,
        avgOrderValuePaid,
        },
        byStatus,
        ticketTypes: ticketTypesSummary,
    };
}
