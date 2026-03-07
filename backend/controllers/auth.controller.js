import bcrypt from "bcrypt";
import crypto from "node:crypto";
import {
    createUser,
    findUserByEmail,
    findUserByUsername,
    findUserById,
    updateLastLogin,
    setEmailVerificationToken,
    setPasswordResetToken,
    findUserByPasswordResetTokenHash,
    updateUserPassword
} from "../services/auth.service.js";
import {
    signAccessToken,
    signRefreshToken,
    verifyRefreshToken,
} from "../libs/jwt.js";

import User from "../models/user.model.js";
import { generateVerifyToken } from "../libs/tokens.js";
import { verifyEmailTemplate } from "../emails/verifyEmail.email.js";
import { sendEmail } from "../libs/mailer.js";
import { loginAlertEmail } from "../emails/loginAlert.email.js";
import { getClientIp } from "../libs/requestInfo.js";
import { resetPasswordEmail } from "../emails/resetPassword.email.js";
import { passwordChangedEmail } from "../emails/passwordChanged.email.js";

const isProd = process.env.NODE_ENV === "production";
const refreshCookieOptions = {
    httpOnly: true,
    sameSite: isProd ? "none" : "lax",   // ✅ prod cross-site
    secure: isProd,                      // ✅ true en prod (https)
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

        // ===== EMAIL VERIFICATION (token + DB + send) =====

        // 1) crear token (plano) + hash (para guardar)
        const { token, tokenHash } = generateVerifyToken();

        // 2) guardar hash + expiración en el usuario (seguridad: no guardamos token plano)
        const VERIFY_TTL_MIN = 60;

        await User.findByIdAndUpdate(user._id, {
        emailVerifyTokenHash: tokenHash,
        emailVerifyExpiresAt: new Date(Date.now() + VERIFY_TTL_MIN * 60 * 1000),
        emailVerified: false,
        });

        // 3) armar URL que abrirá el usuario (frontend)
        const appUrl = process.env.APP_URL || "http://localhost:5173";
        const verifyUrl = `${appUrl}/verify-email?token=${token}`;

        // 4) armar HTML del email
        const html = verifyEmailTemplate({
        username: user.username,
        verifyUrl,
        });

        // 5) (DEV) para no mandar a emails reales mientras probás
        const to = process.env.EMAIL_TO_OVERRIDE || user.email;

        // 6) enviar email con Resend
        try {
        const sent = await sendEmail({
            to,
            subject: "Verificá tu email",
            html,
        });
        console.log("VERIFY_EMAIL_SENT", sent?.id);
        } catch (e) {
        // No rompas el registro por un fallo de email (MVP)
        console.error("VERIFY_EMAIL_FAILED", e.message);
        }
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
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // ✅ cuenta creada con Google / OAuth y sin contraseña local
    if (!user.passwordHash) {
      return res.status(400).json({
        message:
          "This account was created with Google. Please sign in with Google or reset your password.",
      });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    await updateLastLogin(user._id);

    const accessToken = signAccessToken({
      userId: user._id.toString(),
      role: user.role,
    });

    const refreshToken = signRefreshToken({
      userId: user._id.toString(),
      role: user.role,
    });

    res.cookie("refreshToken", refreshToken, refreshCookieOptions);

    if (user.emailVerified) {
      try {
        const when = new Date().toLocaleString("es-AR", {
          timeZone: "America/Argentina/Cordoba",
        });

        const ip = getClientIp(req);
        const userAgent = req.get("user-agent") || "";

        const html = loginAlertEmail({
          username: user.username,
          when,
          ip,
          userAgent,
        });

        const to = process.env.EMAIL_TO_OVERRIDE || user.email;

        const sent = await sendEmail({
          to,
          subject: "Nuevo inicio de sesión",
          html,
        });

        console.log("LOGIN_ALERT_SENT", sent?.id);
      } catch (e) {
        console.error("LOGIN_ALERT_FAILED", e.message);
      }
    }

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

export async function verifyEmail(req, res, next) {
    try {
        const { token } = req.body;

        if (!token) {
        return res.status(400).json({ message: "Missing token" });
        }

        // 1) hashear el token recibido (igual que cuando lo generaste)
        const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

        // 2) buscar usuario con ese hash y que no esté expirado
        const user = await User.findOne({
            emailVerifyTokenHash: tokenHash,
            emailVerifyExpiresAt: { $gt: new Date() },
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired token" });
        }

        // 3) marcar verificado y limpiar token
        user.emailVerified = true;
        user.emailVerifyTokenHash = null;
        user.emailVerifyExpiresAt = null;

        await user.save();

        return res.status(200).json({ ok: true });
    } catch (err) {
        next(err);
    }
}


export async function resendVerification(req, res, next) {
    try {
        const { email } = req.body;

        const normalizedEmail = email.toLowerCase().trim();

        const user = await findUserByEmail(normalizedEmail);

        // ✅ Para no revelar si existe o no (buena práctica)
        // Pero si querés exactamente lo que dijiste: "already verified" cuando corresponda:
        if (user && user.emailVerified) {
            return res.status(200).json({ ok: true, message: "Already verified" });
        }

        // Si no existe el usuario, respondemos OK igual (evita enumeración)
        if (!user) {
            return res.status(200).json({ ok: true, message: "If the account exists, we sent an email" });
        }

        // 1) generar token + hash
        const { token, tokenHash } = generateVerifyToken();

        // 2) guardar hash + expiración
        const VERIFY_TTL_MIN = 60;
        const expiresAt = new Date(Date.now() + VERIFY_TTL_MIN * 60 * 1000);

        await setEmailVerificationToken(user._id, tokenHash, expiresAt);

        // 3) armar URL al frontend
        const appUrl = process.env.APP_URL || "http://localhost:5173";
        const verifyUrl = `${appUrl}/verify-email?token=${token}`;

        // 4) construir email
        const html = verifyEmailTemplate({
            username: user.username,
            verifyUrl,
        });

        // 5) override en dev (para no mandar real)
        const to = process.env.EMAIL_TO_OVERRIDE || user.email;

        // 6) enviar
        try {
            const sent = await sendEmail({
                to,
                subject: "Verificá tu email",
                html,
            });
            console.log("VERIFY_EMAIL_RESENT", sent?.id);
        } catch (e) {
            console.error("VERIFY_EMAIL_RESEND_FAILED", e.message);
            // No rompemos la respuesta del endpoint (MVP)
        }

        return res.status(200).json({ ok: true, message: "Verification email sent" });
    } catch (err) {
        next(err);
    }
}

export async function forgotPassword(req, res, next) {
    try {
        const { email } = req.body;
        const normalizedEmail = email.toLowerCase().trim();

        const user = await findUserByEmail(normalizedEmail);

        // ✅ Respuesta neutra (no revela si existe)
        if (!user) {
            return res.status(200).json({ ok: true, message: "If the account exists, we sent an email" });
        }

        // 1) token + hash
        const { token, tokenHash } = generateVerifyToken();

        // 2) guardar hash + expiración (60 min)
        const RESET_TTL_MIN = 60;
        const expiresAt = new Date(Date.now() + RESET_TTL_MIN * 60 * 1000);
        await setPasswordResetToken(user._id, tokenHash, expiresAt);

        // 3) link al frontend
        const appUrl = process.env.APP_URL || "http://localhost:5173";
        const resetUrl = `${appUrl}/reset-password?token=${token}`;

        // 4) email
        const html = resetPasswordEmail({ username: user.username, resetUrl });

        const to = process.env.EMAIL_TO_OVERRIDE || user.email;

        try {
            const sent = await sendEmail({
                to,
                subject: "Restablecer contraseña",
                html,
            });
            console.log("RESET_EMAIL_SENT", sent?.id);
            } catch (e) {
            console.error("RESET_EMAIL_FAILED", e.message);
            // no rompemos la respuesta
            }

            return res.status(200).json({ ok: true, message: "If the account exists, we sent an email" });
    } catch (err) {
        next(err);
    }
}


export async function resetPassword(req, res, next) {
    try {
        const { token, password } = req.body;

        // 1) hashear token para comparar con DB
        const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

        // 2) buscar usuario por token válido (no expirado)
        const user = await findUserByPasswordResetTokenHash(tokenHash);
        if (!user) return res.status(400).json({ message: "Invalid or expired token" });

        // 3) hashear nuevo password
        const passwordHash = await bcrypt.hash(password, 10);

        // 4) guardar password + limpiar token
        const updatedUser = await updateUserPassword(user._id, passwordHash);
        if (!updatedUser) return res.status(404).json({ message: "User not found" });
        // ✅ enviar email "password changed" (no rompe si falla)
        try {
            const when = new Date().toLocaleString("es-AR", {
                timeZone: "America/Argentina/Cordoba",
            });

            const ip = getClientIp(req);
            const userAgent = req.get("user-agent") || "";

            const html = passwordChangedEmail({
                username: updatedUser.username,
                when,
                ip,
                userAgent,
            });

            const to = process.env.EMAIL_TO_OVERRIDE || updatedUser.email;

            const sent = await sendEmail({
                to,
                subject: "Tu contraseña fue actualizada",
                html,
            });

            console.log("PASSWORD_CHANGED_EMAIL_SENT", sent?.id);
        } catch (e) {
            console.error("PASSWORD_CHANGED_EMAIL_FAILED", e.message);
        }
        return res.status(200).json({ ok: true });
    } catch (err) {
        next(err);
    }
}
