import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
    {
        ticketTypeId: { type: mongoose.Schema.Types.ObjectId, ref: "TicketType", required: true },
        qty: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true, min: 0 },
    },
    { _id: false }
    );

    const orderSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },

        items: { type: [orderItemSchema], required: true },
        total: { type: Number, required: true, min: 0 },

        status: {
        type: String,
        enum: ["PENDING", "PAID", "CANCELED", "EXPIRED"],
        default: "PENDING",
        },

        paymentProvider: { type: String, enum: ["STRIPE", "MERCADOPAGO"], default: null },
        paymentRef: { type: String, default: null }, // paymentIntentId / preferenceId, etc.

        expiresAt: { type: Date }, // opcional para órdenes pendientes
    },
    { timestamps: true }
);

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ eventId: 1, createdAt: -1 });
orderSchema.index({ status: 1, expiresAt: 1 });

export default mongoose.model("Order", orderSchema);
