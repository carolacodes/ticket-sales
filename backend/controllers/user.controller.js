import {
    findUserById,
    updateUserById,
    findUserByUsername,
} from "../services/user.service.js";

import { signAccessToken, signRefreshToken } from "../libs/jwt.js";

const sanitizeUser = (user) => ({
    id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
    emailVerified: user.emailVerified,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
});

const isProd = process.env.NODE_ENV === "production";
const refreshCookieOptions = {
    httpOnly: true,
    sameSite: isProd ? "none" : "lax",   // ✅ prod cross-site
    secure: isProd,                      // ✅ true en prod (https)
    path: "/api/auth/refresh",
};

export async function me(req, res, next) {
    try {
        const user = await findUserById(req.user.id);
        if (!user) return res.status(401).json({ message: "Unauthorized" });
        return res.status(200).json({ user: sanitizeUser(user) });
    } catch (err) {
        next(err);
    }
}

export async function updateMe(req, res, next) {
    try {
        // 1) Tomamos username del body (puede venir undefined)
        const { username } = req.body;

        // 2) Normalizamos: si vino, le hacemos trim (quita espacios)
        const usernameNorm = typeof username === "string" ? username.trim() : undefined;

        // 3) Buscamos el usuario actual
        const user = await findUserById(req.user.id);
        if (!user) return res.status(401).json({ message: "Unauthorized" });

        // 4) Si el username viene vacío después del trim => error (opcional pero recomendado)
        if (username !== undefined && usernameNorm.length === 0) {
        return res.status(400).json({ message: "Username cannot be empty" });
        }

        // 5) Si cambió el username, validamos que no exista
        if (usernameNorm && usernameNorm !== user.username) {
        const exists = await findUserByUsername(usernameNorm);
        if (exists) return res.status(409).json({ message: "Username already in use" });
        }

        // 6) Actualizamos solo si hay algo para actualizar
        const updated = await updateUserById(req.user.id, {
        ...(usernameNorm && usernameNorm !== user.username ? { username: usernameNorm } : {}),
        });

        return res.status(200).json({ user: sanitizeUser(updated) });
    } catch (err) {
        next(err);
    }
}

export async function updateRole(req, res, next) {
    try {
        const { role } = req.body; // "BUYER" | "ORGANIZER"

        const user = await findUserById(req.user.id);
        if (!user) return res.status(401).json({ message: "Unauthorized" });

        // ✅ opcional: si querés permitir solo BUYER -> ORGANIZER, descomentá:
        // if (user.role === "ORGANIZER" && role === "BUYER") {
        //   return res.status(400).json({ message: "Cannot downgrade role" });
        // }

        const updated = await updateUserById(req.user.id, { role });

        // ✅ Nuevo access token con rol actualizado
        const accessToken = signAccessToken({
        userId: updated._id.toString(),
        role: updated.role,
        });

        // ✅ (opcional pero recomendado) Rotar refresh token para que quede alineado al rol
        const refreshToken = signRefreshToken({
        userId: updated._id.toString(),
        role: updated.role,
        });

        res.cookie("refreshToken", refreshToken, refreshCookieOptions);

        return res.status(200).json({
        accessToken,
        user: sanitizeUser(updated),
        });
    } catch (err) {
        next(err);
    }
}

export async function deleteMe(req, res, next) {
    try {
        res.clearCookie("refreshToken", refreshCookieOptions);
        await deleteUserById(req.user.id);
        return res.status(200).json({ ok: true });
    } catch (err) {
        next(err);
    }
}
