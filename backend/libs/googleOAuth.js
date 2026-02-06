import { OAuth2Client } from "google-auth-library";

function mustEnv(name) {
    const v = process.env[name];
    if (!v) throw new Error(`Missing env var: ${name}`);
    return v;
}
// Configurá el cliente OAuth2 de Google
export const googleClient = new OAuth2Client(
    mustEnv("GOOGLE_CLIENT_ID"),
    mustEnv("GOOGLE_CLIENT_SECRET"),
    mustEnv("GOOGLE_CALLBACK_URL")
);
