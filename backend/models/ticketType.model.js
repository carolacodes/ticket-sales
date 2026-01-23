import mongoose from "mongoose";

const ticketTypeSchema = new mongoose.Schema(
    {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },

    name: { type: String, required: true, trim: true, maxlength: 60 },
    price: { type: Number, required: true, min: 0 }, // en centavos o en unidad: definilo y mantenelo
    currency: { type: String, default: "USD" },

    capacity: { type: Number, required: true, min: 1 },
    soldCount: { type: Number, default: 0, min: 0 },

    saleStartAt: { type: Date },
    saleEndAt: { type: Date },
    },
    { timestamps: true }
);

ticketTypeSchema.index({ eventId: 1 });

export default mongoose.model("TicketType", ticketTypeSchema);
