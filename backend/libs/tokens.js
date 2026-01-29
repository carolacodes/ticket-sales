import crypto from "crypto";

export function generateVerifyToken() {
    const token = crypto.randomBytes(32).toString("hex"); // token plano para email
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex"); // lo que guardás en DB
    return { token, tokenHash };
}
