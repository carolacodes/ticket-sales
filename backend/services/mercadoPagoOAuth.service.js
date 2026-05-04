import { OAuth } from "mercadopago";
import { mpClient } from "../libs/mercadoPago.js";

export function buildMercadoPagoAuthUrl(userId) {
    const params = new URLSearchParams({
        client_id: process.env.MP_CLIENT_ID,
        response_type: "code",
        platform_id: "mp",
        state: userId,
        redirect_uri: process.env.MP_REDIRECT_URI,
    });

    return `https://auth.mercadopago.com/authorization?${params.toString()}`;
}

export async function exchangeCodeForToken(code) {
    const oauth = new OAuth(mpClient);

    const response = await oauth.create({
        body: {
            client_secret: process.env.MP_CLIENT_SECRET,
            client_id: process.env.MP_CLIENT_ID,
            grant_type: "authorization_code",
            code,
            redirect_uri: process.env.MP_REDIRECT_URI,
        },
    });

    return response;
}

export async function refreshMercadoPagoAccessToken(refreshToken) {
    if (!refreshToken) {
        throw new Error("Mercado Pago refresh token is required");
    }

    const oauth = new OAuth(mpClient);

    const response = await oauth.create({
        body: {
            client_secret: process.env.MP_CLIENT_SECRET,
            client_id: process.env.MP_CLIENT_ID,
            grant_type: "refresh_token",
            refresh_token: refreshToken,
        },
    });

    return response;
}