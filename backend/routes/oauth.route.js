import { Router } from "express";
import { googleStart, googleCallback } from "../controllers/oauth.controller.js";

const router = Router();

router.get("/auth/google", googleStart);
router.get("/auth/google/callback", googleCallback);

export default router;
