import { Router } from "express";

import {
  createClass,
  getClasses,
  getClassById,
  updateClass,
  deleteClass
} from "../controllers/clases.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

// ✅ Crear
router.post("/",authMiddleware, createClass);

// ✅ Obtener todas (con filtros opcionales)
router.get("/",authMiddleware, getClasses);

// ✅ Obtener una por ID
router.get("/:id",authMiddleware, getClassById);

// ✅ Actualizar (parcial o completo)
router.put("/:id",authMiddleware, updateClass);

// 👉 opcional: PATCH si quieres semántica REST más fina
router.patch("/:id",authMiddleware, updateClass);

// ✅ Eliminar
router.delete("/:id",authMiddleware, deleteClass);

export default router;