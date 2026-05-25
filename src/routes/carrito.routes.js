import { Router } from "express";
import {
    getMiCarrito,
    getCarritos,
    agregarProductoCarrito,
    actualizarCantidadCarrito,
    eliminarProductoCarrito,
    vaciarCarrito,
} from "../controllers/carrito.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
// import { roleMiddleware } from "../middlewares/roles.middleware.js";

const router = Router();
router.get("/admin", authMiddleware, getCarritos);

router.get("/", authMiddleware, getMiCarrito);

router.post("/", authMiddleware, agregarProductoCarrito);

router.put("/", authMiddleware, actualizarCantidadCarrito);

router.delete("/:id", authMiddleware, eliminarProductoCarrito);

router.delete("/", authMiddleware, vaciarCarrito);

export default router;