import { Router } from "express";
import {
  createProducto,
  getProductos,
  getProductoById,
  updateProducto,
  deleteProducto
} from "../controllers/productos.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/upload.js";

const router = Router();

// ✅ Crear (varias imágenes)
router.post(
  "/",
  authMiddleware,
  upload.array("imagen", 5),
  createProducto
);

// ✅ Obtener
router.get("/", getProductos);
router.get("/:id", getProductoById);

// ✅ Actualizar (opcional imágenes nuevas)
router.put(
  "/:id",
  authMiddleware,
  upload.array("imagen", 5),
  updateProducto
);

// ✅ Eliminar
router.delete("/:id", authMiddleware, deleteProducto);

export default router;