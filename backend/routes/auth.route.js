import { Router } from "express";
import { register, login, refresh, logout } from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { registerSchema, loginSchema } from "../schemas/auth.schema.js";

const router = Router();

router.post("/auth/register", validate(registerSchema), register);
router.post("/auth/login", validate(loginSchema), login);
router.get("/auth/refresh", refresh);
router.post("/auth/logout", logout);

export default router;
