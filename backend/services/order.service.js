import Order from "../models/order.model.js";

export async function createOrder(data, session) {
    return await Order.create([data], session ? { session } : undefined).then((r) => r[0]);
}

export async function findOrdersByUserId(userId) {
    return await Order.find({ userId }).sort({ createdAt: -1 });
}

export async function findOrderById(id, session) {
    return await Order.findById(id).session(session || null);
}

export async function updateOrderById(id, update, session) {
    return await Order.findByIdAndUpdate(id, update, { new: true, session });
}
