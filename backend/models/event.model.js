import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
    {
    organizerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 5000 },

    venue: { type: String, trim: true, maxlength: 200 },
    city: { type: String, trim: true, maxlength: 120 },

    startAt: { type: Date, required: true },
    endAt: { type: Date },

    status: { type: String, enum: ["DRAFT", "PUBLISHED", "ENDED"], default: "DRAFT" },
    bannerPublicId: { type: String, trim: true },
    bannerUrl: { type: String, trim: true },
    tags: { type: [String], default: [] },
    },
    { timestamps: true }
);

eventSchema.index({ organizerId: 1, createdAt: -1 });
eventSchema.index({ status: 1, startAt: 1 });
eventSchema.index({ status: 1, tags: 1 });
eventSchema.index({ status: 1, startAt: 1, createdAt: -1 });

export default mongoose.model("Event", eventSchema);
