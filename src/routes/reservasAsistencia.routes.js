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
    deleteReserva,
    getDisponibilidadClases,
    getReservasPorClaseFecha,
    cancelarClasePorMinimo,
    cancelarClasePorMaestro,
    cancelarClasePorAdmin,
} from "../controllers/reservasAsistencia.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/roles.middleware.js";

const router = Router();
// ======================================================
// RESERVAS POR CLASE Y FECHA
// ======================================================
router.get(
    "/clase-fecha",
    authMiddleware,
    getReservasPorClaseFecha
);
// ======================================================
// CREAR RESERVA
// ======================================================
router.post(
    "/",
    authMiddleware,
    createReserva
);

// ======================================================
// OBTENER RESERVAS
// ======================================================
router.get(
    "/",
    authMiddleware,
    getReservas
);

// ======================================================
// LISTA DE ASISTENCIA
// ======================================================
router.get(
    "/asistencia",
    authMiddleware,
    getListaAsistencia
);

// ======================================================
// DISPONIBILIDAD DE CLASES DEL USUARIO
// IMPORTANTE: DEBE ESTAR ANTES DE /:id
// ======================================================
router.get(
    "/disponibilidad",
    authMiddleware,
    getDisponibilidadClases
);

// ======================================================
// OBTENER RESERVA POR ID
// ======================================================
router.get(
    "/:id",
    authMiddleware,
    getReservaById
);

// ======================================================
// CANCELAR RESERVA
// ======================================================
router.put(
    "/:id/cancelar",
    authMiddleware,
    cancelarReserva
);

// ======================================================
// REACTIVAR RESERVA
// ======================================================
router.put(
    "/:id/reactivar",
    authMiddleware,
    reactivarReserva
);
// ======================================================
// CANCELAR CLASE POR MINIMO
// ======================================================
router.put(
    "/cancelar-minimo",
    authMiddleware,
    roleMiddleware("admin"),
    cancelarClasePorMinimo
);
router.put(
    "/cancelar-maestro",
    authMiddleware,
    roleMiddleware("maestro", "admin"),
    cancelarClasePorMaestro
);

router.put(
    "/cancelar-admin",
    authMiddleware,
    roleMiddleware("admin"),
    cancelarClasePorAdmin
);

// ======================================================
// MARCAR ASISTENCIA
// ======================================================
router.put(
    "/:id/asistio",
    authMiddleware,
    roleMiddleware("maestro", "admin"),
    marcarAsistencia
);

// ======================================================
// MARCAR FALTA
// ======================================================
router.put(
    "/:id/falta",
    authMiddleware,
    roleMiddleware("maestro", "admin"),
    marcarFalta
);

// ======================================================
// ASISTENCIA MASIVA
// ======================================================
router.put(
    "/asistencia/masiva",
    authMiddleware,
    roleMiddleware("maestro", "admin"),
    marcarAsistenciaMasiva
);

// ======================================================
// ELIMINAR RESERVA
// ======================================================
router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware("admin"),
    deleteReserva
);

export default router;