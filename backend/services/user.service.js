import User from "../models/user.model.js";

export async function findUserById(id) {
    return await User.findById(id);
}

export async function findUserByUsername(username) {
    return await User.findOne({ username });
}

export async function updateUserById(id, data) {
    return User.findByIdAndUpdate(id, data, { new: true });
}

export async function deleteUserById(id) {
    return await User.findByIdAndDelete(id);
}

export async function findUserByIdSafe(id) {
    return await User.findById(id).select("username email role emailVerified lastLoginAt createdAt");
}