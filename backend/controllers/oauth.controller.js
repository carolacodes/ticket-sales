import crypto from "node:crypto";
import { googleClient } from "../libs/googleOAuth.js";
import { signAccessToken, signRefreshToken } from "../libs/jwt.js";
import {
    findUserByProvider,
    findUserByEmail,
    createUserWithProvider,
    linkProvider,
} from "../services/oauth.service.js";

const oauthStateCookieOptions = {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 10 * 60 * 1000,
    path: "/api/auth/google",
};

const refreshCookieOptions = {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/auth/refresh",
};

function normalizeUsername(base) {
    return base.replace(/\s+/g, "").toLowerCase().slice(0, 20);
}

export async function googleStart(req, res) {
    const state = crypto.randomBytes(16).toString("hex");
    res.cookie("google_oauth_state", state, oauthStateCookieOptions);

    const url = googleClient.generateAuthUrl({
        scope: ["openid", "email", "profile"],
        state,
        prompt: "select_account",
    });

    return res.redirect(url);
}

export async function googleCallback(req, res, next) {
    try {
        const { code, state } = req.query;

        const cookieState = req.cookies?.google_oauth_state;
        if (!state || !cookieState || state !== cookieState) {
        return res.status(401).json({ message: "Invalid OAuth state" });
        }
        res.clearCookie("google_oauth_state", { ...oauthStateCookieOptions, maxAge: 0 });

        const { tokens } = await googleClient.getToken(code);
        if (!tokens.id_token) return res.status(401).json({ message: "Missing id_token" });

        const ticket = await googleClient.verifyIdToken({
        idToken: tokens.id_token,
        audience: process.env.GOOGLE_CLIENT_ID,
        });

        const p = ticket.getPayload();
        const provider = "google";
        const providerUserId = p.sub;
        const email = (p.email || "").toLowerCase();
        const emailVerified = !!p.email_verified;

        const usernameBase = p.name || email.split("@")[0] || "user";
        const username = normalizeUsername(usernameBase);

        let user = await findUserByProvider(provider, providerUserId);

        if (!user) {
        const byEmail = await findUserByEmail(email);

        if (byEmail) {
            user = await linkProvider(byEmail._id, provider, providerUserId);

            if (emailVerified && !user.emailVerified) {
            user.emailVerified = true;
            await user.save();
            }
        } else {
            user = await createUserWithProvider({
            username,
            email,
            provider,
            providerUserId,
            });
        }
        }

        const accessToken = signAccessToken({ userId: user._id.toString(), role: user.role });
        const refreshToken = signRefreshToken({ userId: user._id.toString(), role: user.role });
        res.cookie("refreshToken", refreshToken, refreshCookieOptions);

        const appUrl = process.env.APP_URL || "http://localhost:5173";
        return res.redirect(`${appUrl}/oauth/callback?accessToken=${accessToken}`);
    } catch (err) {
        next(err);
    }
}
