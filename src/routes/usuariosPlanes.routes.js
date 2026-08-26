import { Router } from "express";
import {
    getClasesDisponibles,
    getDetallePlanUsuario
} from "../controllers/usuariosPlanes.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * Obtener clases disponibles del usuario autenticado
 */
router.get(
    "/mis-clases",
    authMiddleware,
    getClasesDisponibles
);

/**
 * Obtener detalle del plan activo
 * (clases restantes, fecha vencimiento, días restantes)
 */
router.get(
    "/mi-plan",
    authMiddleware,
    getDetallePlanUsuario
);


export default router;