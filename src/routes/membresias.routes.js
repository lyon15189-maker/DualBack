import express from "express";

import {
    misMembresias,
    getMembresiasUsuario,
    getMembresiaActiva,
    agregarClases,
    extenderVigencia,
    desactivarMembresia,
    reactivarMembresia
} from "../controllers/membresias.controller.js";

import {
    authMiddleware
} from "../middlewares/auth.middleware.js";

import {
    roleMiddleware
} from "../middlewares/roles.middleware.js";

const router = express.Router();

// ==========================================
// MIS MEMBRESÍAS
// ==========================================
router.get(
    "/mis-membresias",
    authMiddleware,
    misMembresias
);

// ==========================================
// MEMBRESÍA ACTIVA
// ==========================================
router.get(
    "/activa/:usuario",
    authMiddleware,
    getMembresiaActiva
);

// ==========================================
// TODAS LAS MEMBRESÍAS DE UN USUARIO
// ==========================================
router.get(
    "/usuario/:usuario",
    authMiddleware,
    roleMiddleware("admin", "maestro"),
    getMembresiasUsuario
);

// ==========================================
// AGREGAR CLASES
// ==========================================
router.put(
    "/:id/agregar-clases",
    authMiddleware,
    roleMiddleware("admin", "maestro"),
    agregarClases
);

// ==========================================
// EXTENDER VIGENCIA
// ==========================================
router.put(
    "/:id/extender",
    authMiddleware,
    roleMiddleware("admin", "maestro"),
    extenderVigencia
);

// ==========================================
// DESACTIVAR
// ==========================================
router.put(
    "/:id/desactivar",
    authMiddleware,
    roleMiddleware("admin"),
    desactivarMembresia
);

// ==========================================
// REACTIVAR
// ==========================================
router.put(
    "/:id/reactivar",
    authMiddleware,
    roleMiddleware("admin"),
    reactivarMembresia
);

export default router;