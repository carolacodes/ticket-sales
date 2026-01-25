import { verifyAccessToken } from "../libs/jwt.js";

export const requireAuth = (req, res, next) => {
    const header = req.headers.authorization || "";
    const [type, token] = header.split(" ");

    if (type !== "Bearer" || !token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const decoded = verifyAccessToken(token);
        req.user = { id: decoded.sub, role: decoded.role };
        next();
    } catch {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

export const requireRole = (...roles) => (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (!roles.includes(req.user.role)) return res.status(403).json({ message: "Forbidden" });
    next();
};
