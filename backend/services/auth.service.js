import User from "../models/user.model.js";

export async function createUser({ username, email, passwordHash, role = "BUYER" }) {
    return await User.create({ username, email, passwordHash, role });
}

export async function findUserByEmail(email) {
    return await User.findOne({ email });
}

export async function findUserByUsername(username) {
    return await User.findOne({ username });
}

export async function findUserById(id) {
    return await User.findById(id);
}

export async function updateLastLogin(userId) {
    return await User.findByIdAndUpdate(userId, { lastLoginAt: new Date() }, { new: true });
}


export async function setEmailVerificationToken(userId, tokenHash, expiresAt) {
    return await User.findByIdAndUpdate(
        userId,
        {
        emailVerifyTokenHash: tokenHash,
        emailVerifyExpiresAt: expiresAt,
        },
        { new: true }
    );
}


export async function setPasswordResetToken(userId, tokenHash, expiresAt) {
    return await User.findByIdAndUpdate(
        userId,
        {
            passwordResetTokenHash: tokenHash,
            passwordResetExpiresAt: expiresAt,
        },
        { new: true }
    );
}

export async function findUserByPasswordResetTokenHash(tokenHash) {
    return await User.findOne({
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: { $gt: new Date() },
    });
}

export async function updateUserPassword(userId, passwordHash) {
    return await User.findByIdAndUpdate(
        userId,
        {
            passwordHash,
            passwordResetTokenHash: null,
            passwordResetExpiresAt: null,
            passwordChangedAt: new Date(),
        },
        { new: true }
    );
}