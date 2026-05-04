import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        username: { type: String, required: true, unique: true, trim: true },
        email: { type: String, required: true, unique: true, trim: true, lowercase: true },

        // guardá el hash, no el password, default null para OAuth users
        passwordHash: { type: String, default: null, trim: true },

        role: { type: String, enum: ["BUYER", "ORGANIZER"], default: "BUYER" },

        emailVerified: { type: Boolean, default: false },

        emailVerifyTokenHash: { type: String, default: null },
        emailVerifyExpiresAt: { type: Date, default: null },

        passwordResetTokenHash: { type: String, default: null },
        passwordResetExpiresAt: { type: Date, default: null },
        passwordChangedAt: { type: Date, default: null },
        // Para login con Google/Facebook (simple)
        oauthProviders: {
            type: [
                {
                provider: { type: String, enum: ["google", "facebook"], required: true },
                providerUserId: { type: String, required: true },
                },
            ],
            default: [],
        },
        avatarUrl: { type: String, trim: true },
        avatarPublicId: { type: String, trim: true },
        lastLoginAt: { type: Date, default: null },
        mercadoPago: {
            accessToken: { type: String, default: null },
            refreshToken: { type: String, default: null },
            publicKey: { type: String, default: null },
            mpUserId: { type: String, default: null },
            tokenType: { type: String, default: null },
            expiresIn: { type: Number, default: null },
            connectedAt: { type: Date, default: null },
        },
    },
    { timestamps: true }
);

export default mongoose.model("User", userSchema);
