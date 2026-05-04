import { MercadoPagoConfig } from "mercadopago";

export function createMercadoPagoClient(accessToken) {
    if (!accessToken) {
        throw new Error("Mercado Pago access token is required");
    }

    return new MercadoPagoConfig({
        accessToken,
    });
}

export const mpClient = createMercadoPagoClient(process.env.MP_ACCESS_TOKEN);