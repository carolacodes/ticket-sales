import bcrypt from "bcrypt";
import {
    createUser,
    findUserByEmail,
    findUserByUsername,
    findUserById,
    updateLastLogin,
} from "../services/auth.service.js";
import {
    signAccessToken,
    signRefreshToken,
    verifyRefreshToken,
} from "../libs/jwt.js";

const refreshCookieOptions = {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/auth/refresh",
};

const sanitizeUser = (user) => ({
    id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
    emailVerified: user.emailVerified,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
});

export async function register(req, res, next) {
    try {
        const { username, email, password, role } = req.body;

        // (si no usás validate middleware todavía)
        if (!username || !email || !password) {
        return res.status(400).json({ message: "Missing fields" });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const normalizedUsername = username.trim();

        const byEmail = await findUserByEmail(normalizedEmail);
        if (byEmail) return res.status(409).json({ message: "Email already in use" });

        const byUsername = await findUserByUsername(normalizedUsername);
        if (byUsername) return res.status(409).json({ message: "Username already in use" });

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await createUser({
            username: normalizedUsername,
            email: normalizedEmail,
            passwordHash,
            role: role === "ORGANIZER" ? "ORGANIZER" : "BUYER",
        });

        return res.status(201).json({ user: sanitizeUser(user) });
    } catch (err) {
        next(err);
    }
}

export async function login(req, res, next) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Missing fields" });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const user = await findUserByEmail(normalizedEmail);
        if (!user) return res.status(401).json({ message: "Invalid credentials" });

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return res.status(401).json({ message: "Invalid credentials" });

        await updateLastLogin(user._id);

        // ✅ CAMBIO: ahora se llama con { userId, role }
        const accessToken = signAccessToken({ userId: user._id.toString(), role: user.role });
        const refreshToken = signRefreshToken({ userId: user._id.toString(), role: user.role });

        res.cookie("refreshToken", refreshToken, refreshCookieOptions);

        return res.status(200).json({
            accessToken,
            user: sanitizeUser(user),
        });
    } catch (err) {
        next(err);
    }
}

export async function refresh(req, res) {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    try {
        const payload = verifyRefreshToken(token);

        // defensa extra
        if (!payload?.sub) return res.status(401).json({ message: "Unauthorized" });

        const user = await findUserById(payload.sub);
        if (!user) return res.status(401).json({ message: "Unauthorized" });

        const accessToken = signAccessToken({ userId: user._id.toString(), role: user.role });
        return res.status(200).json({ accessToken });
    } catch {
        return res.status(401).json({ message: "Unauthorized" });
    }
}

export function logout(req, res) {
    res.clearCookie("refreshToken", refreshCookieOptions);
    return res.status(200).json({ ok: true });
}
