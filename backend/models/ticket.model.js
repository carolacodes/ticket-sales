import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
    {
        orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
        eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
        ticketTypeId: { type: mongoose.Schema.Types.ObjectId, ref: "TicketType", required: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

        code: { type: String, required: true, unique: true }, // UUID
        status: { type: String, enum: ["VALID", "USED", "VOID"], default: "VALID" },
        checkedInAt: { type: Date, default: null },
    },
    { timestamps: true }
);

ticketSchema.index({ eventId: 1, status: 1 });
ticketSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model("Ticket", ticketSchema);
