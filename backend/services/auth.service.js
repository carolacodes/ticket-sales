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


