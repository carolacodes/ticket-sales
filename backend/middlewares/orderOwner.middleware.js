import { findOrderById } from "../services/order.service.js";

export const requireOrderOwner = async (req, res, next) => {
    try {
        const order = await findOrderById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found" });

        if (order.userId.toString() !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
        }

        req.order = order;
        next();
    } catch (err) {
        next(err);
    }
};
