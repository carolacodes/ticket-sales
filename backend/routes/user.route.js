import { Router } from "express";
import * as userController from "../controllers/user.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { updateMeSchema, updateRoleSchema } from "../schemas/user.schema.js";

const router = Router();

// Perfil del usuario logueado
router.get("/me", requireAuth, userController.me);

// Actualizar perfil básico (username, etc.)
router.patch("/me", requireAuth, validate(updateMeSchema), userController.updateMe);

// Cambiar rol BUYER -> ORGANIZER (o viceversa si lo permitís)
router.patch("/me/role", requireAuth, validate(updateRoleSchema), userController.updateRole);

// Borrar cuenta (opcional)
router.delete("/me", requireAuth, userController.deleteMe);

export default router;
