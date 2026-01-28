import mongoose from "mongoose";

import Order from "../models/order.model.js";
import Ticket from "../models/ticket.model.js";
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function findEventOrders(eventId, { status, from, to, page, limit, q }) {
    const match = { eventId: new mongoose.Types.ObjectId(eventId.toString()) };

    if (status) match.status = status;

    if (from || to) {
        match.createdAt = {};
        if (from) match.createdAt.$gte = new Date(from);
        if (to) match.createdAt.$lte = new Date(to);
    }

    const skip = (page - 1) * limit;

    // Si no hay q, mantenemos find + populate (más simple y rápido)
    if (!q) {
        const [total, orders] = await Promise.all([
        Order.countDocuments(match),
        Order.find(match)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("userId", "username email role"),
        ]);

        return { total, orders };
    }

    // Con q: aggregate + lookup a users
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

    const pipeline = [
        { $match: match },
        {
        $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "buyer",
        },
        },
        { $unwind: "$buyer" },
        {
        $match: {
            $or: [{ "buyer.email": regex }, { "buyer.username": regex }],
        },
        },
        { $sort: { createdAt: -1 } },
        {
        $facet: {
            data: [{ $skip: skip }, { $limit: limit }],
            meta: [{ $count: "total" }],
        },
        },
    ];

    const agg = await Order.aggregate(pipeline);
    const orders = agg[0]?.data || [];
    const total = agg[0]?.meta?.[0]?.total || 0;

    // Para que el DTO siga funcionando, normalizamos el formato a "userId" como objeto
    const normalized = orders.map(({ buyer, ...rest }) => ({
        ...rest,
        userId: buyer,
    }));

    return { total, orders: normalized };
}

export async function findEventTickets(eventId, { status, page, limit, q }) {
    const match = { eventId: new mongoose.Types.ObjectId(eventId.toString()) };
    if (status) match.status = status;

    const skip = (page - 1) * limit;

    // sin q: find + populate
    if (!q) {
        const [total, tickets] = await Promise.all([
        Ticket.countDocuments(match),
        Ticket.find(match)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("userId", "username email")
            .populate("ticketTypeId", "name price"),
        ]);

        return { total, tickets };
    }

    const regex = new RegExp(escapeRegex(q), "i");

    const pipeline = [
        { $match: match },
        {
        $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "buyer",
        },
        },
        { $unwind: "$buyer" },
        {
        $lookup: {
            from: "tickettypes",
            localField: "ticketTypeId",
            foreignField: "_id",
            as: "tt",
        },
        },
        { $unwind: "$tt" },
        {
        $match: {
            $or: [
            { code: regex },
            { "buyer.email": regex },
            { "buyer.username": regex },
            ],
        },
        },
        { $sort: { createdAt: -1 } },
        {
        $facet: {
            data: [{ $skip: skip }, { $limit: limit }],
            meta: [{ $count: "total" }],
        },
        },
    ];

    const agg = await Ticket.aggregate(pipeline);
    const tickets = agg[0]?.data || [];
    const total = agg[0]?.meta?.[0]?.total || 0;

    // Normalizar para que tu DTO funcione igual que con populate
    const normalized = tickets.map(({ buyer, tt, ...rest }) => ({
        ...rest,
        userId: buyer,
        ticketTypeId: tt,
    }));

    return { total, tickets: normalized };
}