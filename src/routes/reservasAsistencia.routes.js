import { Router } from "express";
import {
    createReserva,
    getReservas,
    getReservaById,
    cancelarReserva,
    getListaAsistencia,
    marcarAsistencia,
    marcarFalta,
    reactivarReserva,
    marcarAsistenciaMasiva,
    deleteReserva
} from "../controllers/reservasAsistencia.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/roles.middleware.js";

const router = Router();

/**
 * ✅ Crear reserva (alumnos)
 */
router.post("/", authMiddleware, createReserva);

/**
 * ✅ Obtener reservas (filtros opcionales)
 */
router.get("/", authMiddleware, getReservas);

/**
 * ✅ Lista de asistencia (maestros/admin)
 */
router.get("/asistencia", authMiddleware, getListaAsistencia);

/**
 * ✅ Obtener reserva por ID
 */
router.get("/:id", authMiddleware, getReservaById);

/**
 * ✅ Cancelar reserva
 */
router.put("/:id/cancelar", authMiddleware, cancelarReserva);
router.put("/:id/reactivar", authMiddleware, reactivarReserva);


/**
 * ✅ Marcar asistencia (maestro)
 */
router.put(
    "/:id/asistio",
    authMiddleware,
    roleMiddleware("maestro", "admin"),
    marcarAsistencia
);

/**
 * ✅ Marcar falta (maestro)
 */
router.put(
    "/:id/falta",
    authMiddleware,
    roleMiddleware("maestro", "admin"),
    marcarFalta
);



router.put(
    "/asistencia/masiva",
    authMiddleware,
    roleMiddleware("maestro", "admin"),
    marcarAsistenciaMasiva
);

/**
 * ✅ Eliminar reserva (solo admin)
 */
router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware("admin"),
    deleteReserva
);

export default router;
