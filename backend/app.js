import express from "express";
import morgan from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";
import oauthRoutes from "./routes/oauth.route.js";
import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import eventRoutes from "./routes/event.route.js";
import ticketTypeRoutes from "./routes/ticketType.route.js";
import orderRoutes from "./routes/order.route.js";
import ticketRoutes from "./routes/ticket.route.js";

const app = express();
app.set("trust proxy", 1);
const allowedOrigins = [process.env.CLIENT_URL, "http://localhost:5173"].filter(Boolean);

app.use(
    cors({
        origin: allowedOrigins,
        credentials: true,
    })
);

// Express 5: responder preflight
app.use((req, res, next) => {
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
});

app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (req, res) => {
    res.status(200).json({ ok: true });
});

app.use("/api", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api", eventRoutes);
app.use("/api", ticketTypeRoutes);
app.use("/api", orderRoutes);
app.use("/api", ticketRoutes);
app.use("/api", oauthRoutes);


// ✅ Error handler (recomendado)
app.use((err, req, res, next) => {
    console.error(err);
    const status = err.status || 500;
    res.status(status).json({
        message: err.message || "Internal server error",
    });
});

export default app;
