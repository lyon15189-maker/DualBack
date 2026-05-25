// routes/pagos.routes.js

import express from "express";

import {
    crearPago,
    validarPago,
    getPagos,
    getPagoById,
    cancelarPago,
    eliminarPago,
    reactivarPago,
    getResumenPagos
} from "../controllers/pagos.controller.js";

import {
    authMiddleware
} from "../middlewares/auth.middleware.js";

import {
    roleMiddleware
} from "../middlewares/roles.middleware.js";

const router = express.Router();

// ======================================================
// 🔥 CREAR PAGO
// CUALQUIER USUARIO AUTENTICADO
// ======================================================
router.post(
    "/",
    authMiddleware,
    crearPago
);

// ======================================================
// 🔥 VALIDAR PAGO
// SOLO ADMIN / MAESTRO
// ======================================================
router.put(
    "/:id/validar",
    authMiddleware,
    roleMiddleware("admin", "maestro"),
    validarPago
);
// ======================================================
// 🔥 REACTIVAR PAGO
// SOLO ADMIN / MAESTRO
// ======================================================
router.put(
    "/:id/reactivar",
    authMiddleware,
    roleMiddleware("admin", "maestro"),
    reactivarPago
);
// ======================================================
// 🔥 RESUMEN PAGOS
// SOLO ADMIN / MAESTRO
// ======================================================
router.get(
    "/resumen",
    authMiddleware,
    roleMiddleware("admin", "maestro"),
    getResumenPagos
);

// ======================================================
// 🔥 OBTENER TODOS LOS PAGOS
// SOLO ADMIN / MAESTRO
// ======================================================
router.get(
    "/",
    authMiddleware,
    // roleMiddleware("admin", "maestro"),
    getPagos
);

// ======================================================
// 🔥 OBTENER PAGO POR ID
// ADMIN / MAESTRO / DUEÑO DEL PAGO
// ======================================================
router.get(
    "/:id",
    authMiddleware,
    getPagoById
);

// ======================================================
// 🔥 CANCELAR PAGO
// SOLO ADMIN
// ======================================================
router.put(
    "/:id/cancelar",
    authMiddleware,
    roleMiddleware("admin"),
    cancelarPago
);

// ======================================================
// 🔥 ELIMINAR PAGO
// SOLO ADMIN
// ======================================================
router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware("admin"),
    eliminarPago
);

export default router;