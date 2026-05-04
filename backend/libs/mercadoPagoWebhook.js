import crypto from "crypto";

    /**
     * Parsea el header x-signature de Mercado Pago.
     *
     * Ejemplo real:
     * ts=1776270355,v1=93f16ad09ff6f0ee491655c4e180f4af4090b68872856bca06bdaeab7fb71472
     *
     * Devuelve:
     * {
     *   ts: "1776270355",
     *   v1: "93f16ad09ff6f0ee491655c4e180f4af4090b68872856bca06bdaeab7fb71472"
     * }
     */
export function parseMercadoPagoSignature(signatureHeader) {
    if (!signatureHeader || typeof signatureHeader !== "string") {
        return { ts: null, v1: null };
    }

    const parts = signatureHeader.split(",");
    const parsed = {};

    for (const part of parts) {
        const [rawKey, rawValue] = part.split("=");
        const key = rawKey?.trim();
        const value = rawValue?.trim();

        if (key && value) {
        parsed[key] = value;
        }
    }

    return {
        ts: parsed.ts || null,
        v1: parsed.v1 || null,
    };
    }

    /**
     * Construye el "manifest" o string base que luego se firma.
     *
     * Según la documentación de Mercado Pago, para validar la firma
     * se usa un template con:
     * id:[data.id_url];request-id:[x-request-id_header];ts:[ts_header];
     *
     * En tu caso, data.id puede llegar por:
     * - req.query["data.id"]  -> notificación tipo payment.created
     * - req.query.id          -> notificación tipo topic=payment
     */
    export function buildMercadoPagoManifest({ dataId, requestId, ts }) {
    return `id:${dataId};request-id:${requestId};ts:${ts};`;
    }

    /**
     * Calcula la firma esperada con HMAC SHA256 usando tu clave secreta.
     */
    export function generateMercadoPagoHmac({ manifest, secret }) {
    return crypto
        .createHmac("sha256", secret)
        .update(manifest)
        .digest("hex");
    }

    /**
     * Valida la firma del webhook.
     *
     * Devuelve un objeto útil para debug:
     * {
     *   ok: boolean,
     *   reason: string | null,
     *   expected: string | null,
     *   received: string | null,
     *   manifest: string | null
     * }
     */
    export function verifyMercadoPagoWebhookSignature(req) {
    const secret = process.env.MP_WEBHOOK_SECRET;

    if (!secret) {
        return {
        ok: false,
        reason: "MP_WEBHOOK_SECRET is missing",
        expected: null,
        received: null,
        manifest: null,
        };
    }

    const signatureHeader = req.headers["x-signature"];
    const requestIdHeader = req.headers["x-request-id"];

    const { ts, v1 } = parseMercadoPagoSignature(signatureHeader);

    // Mercado Pago suele mandar el identificador del evento por query.
    const dataId = req.query["data.id"] || req.query.id;

    if (!signatureHeader) {
        return {
        ok: false,
        reason: "x-signature header missing",
        expected: null,
        received: null,
        manifest: null,
        };
    }

    if (!requestIdHeader) {
        return {
        ok: false,
        reason: "x-request-id header missing",
        expected: null,
        received: null,
        manifest: null,
        };
    }

    if (!ts || !v1) {
        return {
        ok: false,
        reason: "x-signature format invalid",
        expected: null,
        received: v1 || null,
        manifest: null,
        };
    }

    if (!dataId) {
        return {
        ok: false,
        reason: "data.id / id missing in query",
        expected: null,
        received: v1,
        manifest: null,
        };
    }

    const manifest = buildMercadoPagoManifest({
        dataId,
        requestId: requestIdHeader,
        ts,
    });

    const expected = generateMercadoPagoHmac({
        manifest,
        secret,
    });

    const expectedBuffer = Buffer.from(expected, "utf8");
    const receivedBuffer = Buffer.from(v1, "utf8");

    const ok =
        expectedBuffer.length === receivedBuffer.length &&
        crypto.timingSafeEqual(expectedBuffer, receivedBuffer);

    return {
        ok,
        reason: ok ? null : "signature mismatch",
        expected,
        received: v1,
        manifest,
    };
}