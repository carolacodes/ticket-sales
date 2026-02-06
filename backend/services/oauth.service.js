import User from "../models/user.model.js";

export async function findUserByProvider(provider, providerUserId) {
    return await User.findOne({
        oauthProviders: { $elemMatch: { provider, providerUserId } },
    });
}

export async function findUserByEmail(email) {
    return await User.findOne({ email: email.toLowerCase() });
}

export async function createUserWithProvider({ username, email, provider, providerUserId }) {
    return await User.create({
        username,
        email: email.toLowerCase(),
        passwordHash: null,
        role: "BUYER",
        emailVerified: true,
        oauthProviders: [{ provider, providerUserId }],
    });
}

export async function linkProvider(userId, provider, providerUserId) {
    return await User.findByIdAndUpdate(
        userId,
        { $addToSet: { oauthProviders: { provider, providerUserId } } },
        { new: true }
    );
}
