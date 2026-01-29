import { Router } from "express";
import { register, login, refresh, logout, verifyEmail, resendVerification, forgotPassword, resetPassword } from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { registerSchema, loginSchema , resendVerificationSchema, forgotPasswordSchema, resetPasswordSchema} from "../schemas/auth.schema.js";

const router = Router();

router.post("/auth/register", 
    validate(registerSchema), 
    register);
router.post("/auth/verify-email", verifyEmail);
router.post("/auth/resend-verification", 
    validate(resendVerificationSchema), 
    resendVerification);
router.post("/auth/forgot-password", 
    validate(forgotPasswordSchema), 
    forgotPassword);
router.post("/auth/reset-password", 
    validate(resetPasswordSchema), 
    resetPassword);
router.post("/auth/login", 
    validate(loginSchema), 
    login);
router.get("/auth/refresh", refresh);
router.post("/auth/logout", logout);

export default router;
