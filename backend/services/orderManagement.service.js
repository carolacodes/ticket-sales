//import mongoose from "mongoose";
import Order from "../models/order.model.js";

export async function findOrderById(orderId) {
    return await Order.findById(orderId);
}

export async function cancelOrderById(orderId) {
    return await Order.findByIdAndUpdate(
        orderId,
        { status: "CANCELED", canceledAt: new Date() },
        { new: true }
    );
}
