// controllers/pagos.controller.js

import Pago from "../models/pagos.model.js";
import Producto from "../models/productos.model.js";
import Plan from "../models/planes.model.js";
import Clase from "../models/clases.model.js";
import Cupon from "../models/cupones.model.js";
import ReservaAsistencia from "../models/reservasAsistencia.model.js";

// ======================================================
// 🔥 CREAR PAGO
// ======================================================
export const crearPago = async (req, res) => {

    try {

        const {
            usuario,
            items,
            metodoPago,
            codigoCupon,
            referenciaTransferencia,
            comprobante,
            notas
        } = req.body;

        // ==========================================
        // VALIDACIONES
        // ==========================================
        if (!usuario) {

            return res.status(400).json({
                ok: false,
                message: "Usuario requerido"
            });

        }

        if (!items || !Array.isArray(items) || items.length === 0) {

            return res.status(400).json({
                ok: false,
                message: "Debe enviar items"
            });

        }

        // ==========================================
        // CONSTRUIR ITEMS
        // ==========================================
        const itemsPago = [];

        for (const item of items) {

            let modelo = null;

            let tipoModelo = "";

            // ======================================
            // PRODUCTOS
            // ======================================
            if (item.tipo === "producto") {

                modelo = await Producto.findById(item.id);

                tipoModelo = "Producto";

                if (!modelo) {

                    return res.status(404).json({
                        ok: false,
                        message: "Producto no encontrado"
                    });

                }

                const cantidad = Number(item.cantidad || 1);

                if (modelo.cantidad < cantidad) {

                    return res.status(400).json({
                        ok: false,
                        message: `Stock insuficiente para ${modelo.nombre}`
                    });

                }

                itemsPago.push({
                    tipo: "producto",
                    referencia: modelo._id,
                    tipoModelo,
                    nombre: modelo.nombre,
                    cantidad,
                    precioUnitario: modelo.precio,
                    subtotal: modelo.precio * cantidad
                });

            }

            // ======================================
            // PLANES
            // ======================================
            else if (item.tipo === "plan") {

                modelo = await Plan.findById(item.id);

                tipoModelo = "Plan";

                if (!modelo) {

                    return res.status(404).json({
                        ok: false,
                        message: "Plan no encontrado"
                    });

                }

                itemsPago.push({
                    tipo: "plan",
                    referencia: modelo._id,
                    tipoModelo,
                    nombre: modelo.nombre,
                    cantidad: 1,
                    precioUnitario: modelo.precio,
                    subtotal: modelo.precio
                });

            }

            // ======================================
            // CLASES
            // ======================================
            else if (item.tipo === "clase") {
                if (
                    !item.instructor ||
                    !item.fecha ||
                    !item.hora
                ) {

                    return res.status(400).json({
                        ok: false,
                        message:
                            "Las clases requieren instructor, fecha y hora"
                    });

                }

                modelo = await Clase.findById(item.id);

                tipoModelo = "Clase";

                if (!modelo) {

                    return res.status(404).json({
                        ok: false,
                        message: "Clase no encontrada"
                    });

                }

                const precioClase = Number(item.precio || 0);

                itemsPago.push({
                    tipo: "clase",
                    referencia: modelo._id,
                    tipoModelo,
                    nombre: modelo.nombre,
                    cantidad: 1,
                    precioUnitario: precioClase,
                    subtotal: precioClase,
                    instructor: item.instructor,
                    fecha: item.fecha,
                    hora: item.hora
                });

            }

        }

        // ==========================================
        // CREAR PAGO
        // ==========================================
        const pago = new Pago({

            usuario,

            items: itemsPago,

            metodoPago,

            referenciaTransferencia,

            comprobante,

            notas,

            estado: "pendiente"

        });

        // ==========================================
        // APLICAR CUPÓN
        // SOLO GUARDARLO
        // NO DESCONTAR USOS TODAVÍA
        // ==========================================
        if (codigoCupon) {

            const cupon = await Cupon.findOne({
                codigo: codigoCupon.toUpperCase()
            });

            if (!cupon) {

                return res.status(404).json({
                    ok: false,
                    message: "Cupón inválido"
                });

            }

            const ahora = new Date();

            if (!cupon.activo) {

                return res.status(400).json({
                    ok: false,
                    message: "Cupón inactivo"
                });

            }

            if (cupon.usos <= 0) {

                return res.status(400).json({
                    ok: false,
                    message: "Cupón agotado"
                });

            }

            if (
                ahora < cupon.fechaInicio ||
                ahora > cupon.fechaFin
            ) {

                return res.status(400).json({
                    ok: false,
                    message: "Cupón expirado"
                });

            }

            const aplica = itemsPago.some(
                (item) => item.tipo === cupon.aplica
            );

            if (!aplica) {

                return res.status(400).json({
                    ok: false,
                    message: "El cupón no aplica para este pago"
                });

            }

            pago.cupon = cupon._id;

            pago.tipoDescuento = cupon.descuento;

            pago.valorDescuento = cupon.cantidad;

        }

        await pago.save();

        res.status(201).json({
            ok: true,
            message: "Pago creado y pendiente de validación",
            data: pago
        });

    } catch (error) {

        res.status(400).json({
            ok: false,
            message: error.message
        });

    }

};

// ======================================================
// 🔥 VALIDAR PAGO
// SOLO ADMIN O MAESTRO
// ======================================================
export const validarPago = async (req, res) => {

    try {

        const pago = await Pago.findById(
            req.params.id
        );

        if (!pago) {

            return res.status(404).json({
                ok: false,
                message: "Pago no encontrado"
            });

        }

        if (pago.estado === "pagado") {

            return res.status(400).json({
                ok: false,
                message: "El pago ya fue validado"
            });

        }

        // ==========================================
        // DESCONTAR USO CUPÓN
        // ==========================================
        if (pago.cupon) {

            const cupon = await Cupon.findById(
                pago.cupon
            );

            if (!cupon) {

                return res.status(404).json({
                    ok: false,
                    message: "Cupón no encontrado"
                });

            }

            if (cupon.usos <= 0) {

                return res.status(400).json({
                    ok: false,
                    message: "Cupón agotado"
                });

            }

            cupon.usos -= 1;

            await cupon.save();

        }

        // ==========================================
        // VALIDAR DATOS DE CLASES
        // ==========================================
        for (const item of pago.items) {

            if (item.tipo === "clase") {

                if (
                    !item.instructor ||
                    !item.fecha ||
                    !item.hora
                ) {

                    return res.status(400).json({
                        ok: false,
                        message:
                            `La clase "${item.nombre}" no tiene instructor, fecha u hora`
                    });

                }

            }

        }
        // ==========================================
        // ACTUALIZAR PAGO
        // ==========================================
        pago.estado = "pagado";

        pago.recibidoPor = req.user._id;

        pago.fechaPago = new Date();

        await pago.save();

        // ==========================================
        // DESCONTAR STOCK
        // ==========================================
        for (const item of pago.items) {

            // ==============================
            // PRODUCTOS
            // ==============================
            if (item.tipo === "producto") {

                const producto = await Producto.findById(
                    item.referencia
                );

                if (producto) {

                    producto.cantidad -= item.cantidad;

                    producto.vendidos += item.cantidad;

                    if (producto.cantidad <= 0) {

                        producto.estado = "agotado";

                    }

                    await producto.save();

                }

            }

            // ==============================
            // CLASES
            // ==============================
            if (item.tipo === "clase") {

                const existeReserva =
                    await ReservaAsistencia.findOne({
                        alumno: pago.usuario,
                        clase: item.referencia
                    });

                if (!existeReserva) {

                    await ReservaAsistencia.create({
                        alumno: pago.usuario,
                        clase: item.referencia,
                        instructor: item.instructor,
                        fecha: item.fecha,
                        hora: item.hora
                    });

                }

            }

        }

        res.json({
            ok: true,
            message: "Pago validado correctamente",
            data: pago
        });

    } catch (error) {

        res.status(400).json({
            ok: false,
            message: error.message
        });

    }
};

// ======================================================
// 🔥 OBTENER PAGOS
// ======================================================
export const getPagos = async (req, res) => {

    try {

        const filters = {};

        if (req.query.usuario) {
            filters.usuario = req.query.usuario;
        }

        if (req.query.estado) {
            filters.estado = req.query.estado;
        }

        if (req.query.metodoPago) {
            filters.metodoPago = req.query.metodoPago;
        }

        // =====================================
        // FILTRO FECHAS
        // =====================================
        if (
            req.query.fechaInicio ||
            req.query.fechaFin
        ) {

            filters.createdAt = {};

            if (req.query.fechaInicio) {

                filters.createdAt.$gte = new Date(
                    req.query.fechaInicio
                );

            }

            if (req.query.fechaFin) {

                const fechaFin = new Date(
                    req.query.fechaFin
                );

                fechaFin.setHours(23, 59, 59, 999);

                filters.createdAt.$lte = fechaFin;

            }

        }

        const pagos = await Pago.find(filters)
            .populate(
                "usuario",
                "nombre apellidos email"
            )
            .populate(
                "recibidoPor",
                "nombre apellidos rol"
            )
            .populate("cupon")
            .sort({ createdAt: -1 });

        res.json({
            ok: true,
            data: pagos
        });

    } catch (error) {

        res.status(400).json({
            ok: false,
            message: error.message
        });

    }

};

// ======================================================
// 🔥 OBTENER PAGO POR ID
// ======================================================
export const getPagoById = async (req, res) => {

    try {

        const pago = await Pago.findById(
            req.params.id
        )
            .populate(
                "usuario",
                "nombre apellidos email"
            )
            .populate(
                "recibidoPor",
                "nombre apellidos rol"
            )
            .populate("cupon");

        if (!pago) {

            return res.status(404).json({
                ok: false,
                message: "Pago no encontrado"
            });

        }

        res.json({
            ok: true,
            data: pago
        });

    } catch (error) {

        res.status(400).json({
            ok: false,
            message: error.message
        });

    }

};

// ======================================================
// 🔥 CANCELAR PAGO
// ======================================================
export const cancelarPago = async (req, res) => {

    try {

        const pago = await Pago.findById(
            req.params.id
        );

        if (!pago) {

            return res.status(404).json({
                ok: false,
                message: "Pago no encontrado"
            });

        }

        if (pago.estado === "cancelado") {

            return res.status(400).json({
                ok: false,
                message: "El pago ya está cancelado"
            });

        }

        // ==========================================
        // DEVOLVER CUPÓN
        // ==========================================
        if (
            pago.estado === "pagado" &&
            pago.cupon
        ) {

            const cupon = await Cupon.findById(
                pago.cupon
            );

            if (cupon) {

                cupon.usos += 1;

                await cupon.save();

            }

        }

        pago.estado = "cancelado";

        await pago.save();

        // ==========================================
        // DEVOLVER STOCK
        // ==========================================
        for (const item of pago.items) {

            if (item.tipo === "producto") {

                const producto = await Producto.findById(
                    item.referencia
                );

                if (producto) {

                    producto.cantidad += item.cantidad;

                    producto.vendidos -= item.cantidad;

                    if (producto.cantidad > 0) {

                        producto.estado = "disponible";

                    }

                    await producto.save();

                }

            }

        }

        res.json({
            ok: true,
            message: "Pago cancelado",
            data: pago
        });

    } catch (error) {

        res.status(400).json({
            ok: false,
            message: error.message
        });

    }

};

// ======================================================
// 🔥 ELIMINAR PAGO
// ======================================================
export const eliminarPago = async (req, res) => {

    try {

        const pago = await Pago.findById(
            req.params.id
        );

        if (!pago) {

            return res.status(404).json({
                ok: false,
                message: "Pago no encontrado"
            });

        }

        // ==========================================
        // DEVOLVER STOCK / RESERVAS
        // ==========================================
        if (pago.estado === "pagado") {

            for (const item of pago.items) {

                // ==============================
                // PRODUCTOS
                // ==============================
                if (item.tipo === "producto") {

                    const producto =
                        await Producto.findById(
                            item.referencia
                        );

                    if (producto) {

                        producto.cantidad += item.cantidad;

                        producto.vendidos -= item.cantidad;

                        if (producto.cantidad > 0) {

                            producto.estado =
                                "disponible";

                        }

                        await producto.save();

                    }

                }

                // ==============================
                // CLASES
                // ==============================
                if (item.tipo === "clase") {

                    await ReservaAsistencia.deleteMany({
                        alumno: pago.usuario,
                        clase: item.referencia
                    });

                }

            }

        }

        // ==========================================
        // DEVOLVER USO CUPÓN
        // ==========================================
        if (
            pago.estado === "pagado" &&
            pago.cupon
        ) {

            const cupon = await Cupon.findById(
                pago.cupon
            );

            if (cupon) {

                cupon.usos += 1;

                await cupon.save();

            }

        }

        // ==========================================
        // ELIMINAR PAGO
        // ==========================================
        await pago.deleteOne();

        res.json({
            ok: true,
            message: "Pago eliminado correctamente"
        });

    } catch (error) {

        res.status(400).json({
            ok: false,
            message: error.message
        });

    }

};

// ======================================================
// 🔥 RESUMEN PAGOS
// ======================================================
export const getResumenPagos = async (req, res) => {

    try {

        const filters = {
            estado: "pagado"
        };

        // =====================================
        // FILTRO FECHAS
        // =====================================
        if (
            req.query.fechaInicio ||
            req.query.fechaFin
        ) {

            filters.fechaPago = {};

            if (req.query.fechaInicio) {

                filters.fechaPago.$gte = new Date(
                    req.query.fechaInicio
                );

            }

            if (req.query.fechaFin) {

                const fechaFin = new Date(
                    req.query.fechaFin
                );

                fechaFin.setHours(23, 59, 59, 999);

                filters.fechaPago.$lte = fechaFin;

            }

        }

        // =====================================
        // INGRESOS Y TRANSACCIONES
        // =====================================
        const resumenGeneral = await Pago.aggregate([
            {
                $match: filters
            },
            {
                $group: {
                    _id: null,

                    ingresosTotales: {
                        $sum: "$total"
                    },

                    numeroTransacciones: {
                        $sum: 1
                    },

                    promedioTransacciones: {
                        $avg: "$total"
                    }
                }
            }
        ]);

        // =====================================
        // INGRESOS POR TIPO
        // clases / productos / planes
        // =====================================
        const ingresosPorTipo = await Pago.aggregate([
            {
                $match: filters
            },

            {
                $unwind: "$items"
            },

            {
                $group: {
                    _id: "$items.tipo",

                    total: {
                        $sum: "$items.subtotal"
                    }
                }
            }
        ]);

        // =====================================
        // INGRESOS POR MÉTODO DE PAGO
        // =====================================
        const ingresosPorMetodoPago =
            await Pago.aggregate([
                {
                    $match: filters
                },

                {
                    $group: {
                        _id: "$metodoPago",

                        total: {
                            $sum: "$total"
                        },

                        cantidad: {
                            $sum: 1
                        }
                    }
                }
            ]);

        // =====================================
        // USUARIOS QUE PAGARON
        // =====================================
        const usuariosPagaron =
            await Pago.distinct(
                "usuario",
                filters
            );

        // =====================================
        // USUARIOS CON PLAN
        // =====================================
        const usuariosConPlan =
            await Pago.distinct(
                "usuario",
                {
                    ...filters,
                    "items.tipo": "plan"
                }
            );

        // =====================================
        // FORMATEAR TIPOS
        // =====================================
        const tipos = {
            clase: 0,
            producto: 0,
            plan: 0
        };

        ingresosPorTipo.forEach((item) => {

            tipos[item._id] = item.total;

        });

        // =====================================
        // FORMATEAR MÉTODOS PAGO
        // =====================================
        const metodosPago = {};

        ingresosPorMetodoPago.forEach((item) => {

            metodosPago[item._id] = {
                total: item.total,
                cantidad: item.cantidad
            };

        });

        // =====================================
        // RESPONSE
        // =====================================
        res.json({
            ok: true,

            data: {

                ingresosTotales:
                    resumenGeneral[0]
                        ?.ingresosTotales || 0,

                numeroTransacciones:
                    resumenGeneral[0]
                        ?.numeroTransacciones || 0,

                promedioTransacciones:
                    resumenGeneral[0]
                        ?.promedioTransacciones || 0,

                usuariosPagaron:
                    usuariosPagaron.length,

                usuariosConPlan:
                    usuariosConPlan.length,

                ingresosPorTipo: tipos,

                ingresosPorMetodoPago:
                    metodosPago

            }
        });

    } catch (error) {

        res.status(400).json({
            ok: false,
            message: error.message
        });

    }

};
// ======================================================
// 🔥 REACTIVAR PAGO
// SOLO ADMIN / MAESTRO
// ======================================================
export const reactivarPago = async (req, res) => {

    try {

        const pago = await Pago.findById(
            req.params.id
        );

        if (!pago) {

            return res.status(404).json({
                ok: false,
                message: "Pago no encontrado"
            });

        }

        // ==========================================
        // SOLO CANCELADOS
        // ==========================================
        if (pago.estado !== "cancelado") {

            return res.status(400).json({
                ok: false,
                message:
                    "Solo los pagos cancelados pueden reactivarse"
            });

        }

        // ==========================================
        // CAMBIAR A PENDIENTE
        // ==========================================
        pago.estado = "pendiente";

        // limpiar validación anterior
        pago.recibidoPor = null;

        await pago.save();

        res.json({
            ok: true,
            message:
                "Pago reactivado correctamente",
            data: pago
        });

    } catch (error) {

        res.status(400).json({
            ok: false,
            message: error.message
        });

    }

};