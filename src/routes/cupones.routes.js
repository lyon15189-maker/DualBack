import { Router } from "express";
import {
    createCupon,
    getCupones,
    getCuponById,
    updateCupon,
    deleteCupon,
} from "../controllers/cupones.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

// ✅ Crear cupón
router.post("/", authMiddleware, createCupon);

// ✅ Obtener todos
router.get("/", authMiddleware, getCupones);

// ✅ Obtener por ID
router.get("/:id", authMiddleware, getCuponById);

// ✅ Actualizar
router.put("/:id", authMiddleware, updateCupon);

// ✅ Eliminar
router.delete("/:id", authMiddleware, deleteCupon);

export default router;
