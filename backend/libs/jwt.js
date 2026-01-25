import jwt from "jsonwebtoken";

function mustEnv(name) {
    const v = process.env[name];
    if (!v) throw new Error(`Missing env var: ${name}`);
    return v;
}

/**
 * Access Token (corto)
 * - Se manda en Authorization: Bearer <token>
 * - Sirve para autorizar requests a endpoints protegidos
 */
export function signAccessToken({ userId, role }) {
    const secret = mustEnv("JWT_ACCESS_SECRET");
    const expiresIn = process.env.JWT_ACCESS_EXPIRES_IN || "15m";

    // payload mínimo: role
    return jwt.sign(
        { role },
        secret,
        { subject: userId, expiresIn }
    );
}

/**
 * Refresh Token (largo)
 * - Se guarda en cookie httpOnly
 * - Sirve SOLO para pedir un nuevo access token cuando vence
 */
export function signRefreshToken({ userId, role }) {
    const secret = mustEnv("JWT_REFRESH_SECRET");
    const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

    return jwt.sign(
        { role },
        secret,
        { subject: userId, expiresIn }
    );
}

/**
 * Verifica Access Token (para middleware)
 * - Lanza error si expiró o fue manipulado
 * - Devuelve payload decodificado si es válido
 */
export function verifyAccessToken(token) {
    const secret = mustEnv("JWT_ACCESS_SECRET");
    return jwt.verify(token, secret);
}

/**
 * Verifica Refresh Token (para /auth/refresh)
 * - Lanza error si expiró o fue manipulado
 * - Devuelve payload decodificado si es válido
 */
export function verifyRefreshToken(token) {
    const secret = mustEnv("JWT_REFRESH_SECRET");
    return jwt.verify(token, secret);
}
