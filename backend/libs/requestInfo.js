export function getClientIp(req) {
    // Si estás detrás de proxy, suele venir en x-forwarded-for
    const xff = req.headers["x-forwarded-for"];
    if (typeof xff === "string" && xff.length > 0) {
        return xff.split(",")[0].trim();
    }
    return req.ip; // fallback
}
