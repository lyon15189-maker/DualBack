import { Router } from "express";
import {
    createPlan,
    getPlanes,
    getPlanById,
    updatePlan,
    deletePlan,
} from "../controllers/planes.controller.js";

const router = Router();

// ✅ Crear plan
router.post("/", createPlan);

// ✅ Obtener todos (filtros ?activo=true)
router.get("/", getPlanes);

// ✅ Obtener por ID
router.get("/:id", getPlanById);

// ✅ Actualizar
router.put("/:id", updatePlan);

// ✅ Eliminar
router.delete("/:id", deletePlan);

export default router;