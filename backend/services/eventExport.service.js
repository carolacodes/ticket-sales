import mongoose from "mongoose";
import Order from "../models/order.model.js";
import Ticket from "../models/ticket.model.js";

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function exportEventOrders(eventId, { status, from, to, q }) {
    const match = { eventId: new mongoose.Types.ObjectId(eventId.toString()) };

    if (status) match.status = status;

    if (from || to) {
        match.createdAt = {};
        if (from) match.createdAt.$gte = new Date(from);
        if (to) match.createdAt.$lte = new Date(to);
    }

    // Sin q: find + populate
    if (!q) {
        return await Order.find(match)
        .sort({ createdAt: -1 })
        .populate("userId", "username email role");
    }

    // Con q: aggregate + lookup buyer
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
        $match: {
            $or: [{ "buyer.email": regex }, { "buyer.username": regex }],
        },
        },
        { $sort: { createdAt: -1 } },
    ];

    const rows = await Order.aggregate(pipeline);

    // normalizar para que el controller pueda leer igual que populate
    return rows.map(({ buyer, ...rest }) => ({ ...rest, userId: buyer }));
}

export async function exportEventTickets(eventId, { status, q }) {
    const match = { eventId: new mongoose.Types.ObjectId(eventId.toString()) };
    if (status) match.status = status;

    // Sin q: find + populate
    if (!q) {
        return await Ticket.find(match)
        .sort({ createdAt: -1 })
        .populate("userId", "username email")
        .populate("ticketTypeId", "name price");
    }

    // Con q: aggregate + lookup buyer + ticketType
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
    ];

    const rows = await Ticket.aggregate(pipeline);

    return rows.map(({ buyer, tt, ...rest }) => ({
        ...rest,
        userId: buyer,
        ticketTypeId: tt,
    }));
}
