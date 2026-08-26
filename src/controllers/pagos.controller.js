// controllers/pagos.controller.js

import Pago from "../models/pagos.model.js";
import Producto from "../models/productos.model.js";
import Plan from "../models/planes.model.js";
import Cupon from "../models/cupones.model.js";
import UsuarioPlan from "../models/usuariosPlanes.model.js";
import User from "../models/usuarios.model.js";
import {
    enviarCorreo,
    notificarAdministradores
} from "../services/email.service.js";
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
        // VALIDAR USUARIO
        // ==========================================
        if (!usuario) {

            return res.status(400).json({
                ok: false,
                message: "Usuario requerido"
            });

        }

        const usuarioExiste = await User.findById(usuario);

        if (!usuarioExiste) {

            return res.status(404).json({
                ok: false,
                message: "Usuario no encontrado"
            });

        }

        // ==========================================
        // VALIDAR ITEMS
        // ==========================================
        if (
            !items ||
            !Array.isArray(items) ||
            items.length === 0
        ) {

            return res.status(400).json({
                ok: false,
                message: "Debe enviar al menos un item"
            });

        }

        // ==========================================
        // VALIDAR MÉTODO DE PAGO
        // ==========================================
        const metodosPermitidos = [
            "efectivo",
            "transferencia",
            "stripe"
        ];

        if (!metodosPermitidos.includes(metodoPago)) {

            return res.status(400).json({
                ok: false,
                message: "Método de pago no válido"
            });

        }

        // ==========================================
        // CONSTRUIR ITEMS DEL PAGO
        // ==========================================
        const itemsPago = [];

        for (const item of items) {

            // ======================================
            // VALIDAR TIPO
            // ======================================
            if (
                ![
                    "producto",
                    "plan",
                ].includes(item.tipo)
            ) {

                return res.status(400).json({
                    ok: false,
                    message:
                        `Tipo de item no válido: ${item.tipo}`
                });

            }

            // ======================================
            // PRODUCTO
            // ======================================
            if (item.tipo === "producto") {

                const producto =
                    await Producto.findById(item.id);

                if (!producto) {

                    return res.status(404).json({
                        ok: false,
                        message: "Producto no encontrado"
                    });

                }

                const cantidad =
                    Number(item.cantidad || 1);

                if (
                    !Number.isInteger(cantidad) ||
                    cantidad <= 0
                ) {

                    return res.status(400).json({
                        ok: false,
                        message:
                            "La cantidad del producto no es válida"
                    });

                }

                // ==================================
                // VALIDAR STOCK
                // ==================================
                if (
                    producto.cantidad < cantidad
                ) {

                    return res.status(400).json({
                        ok: false,
                        message:
                            `Stock insuficiente para ${producto.nombre}`
                    });

                }

                itemsPago.push({

                    tipo: "producto",

                    referencia: producto._id,

                    tipoModelo: "Producto",

                    nombre: producto.nombre,

                    cantidad,

                    precioUnitario: producto.precio,

                    subtotal:
                        producto.precio * cantidad

                });

            }

            // ======================================
            // PLAN
            // ======================================
            else if (item.tipo === "plan") {

                const plan =
                    await Plan.findById(item.id);

                if (!plan) {

                    return res.status(404).json({
                        ok: false,
                        message: "Plan no encontrado"
                    });

                }

                // ==================================
                // VALIDAR PLAN ACTIVO
                // ==================================
                if (!plan.activo) {

                    return res.status(400).json({
                        ok: false,
                        message:
                            `El plan ${plan.nombre} no está activo`
                    });

                }

                itemsPago.push({

                    tipo: "plan",

                    referencia: plan._id,

                    tipoModelo: "Plan",

                    nombre: plan.nombre,

                    cantidad: 1,

                    precioUnitario: plan.precio,

                    subtotal: plan.precio

                });

            }


        }

        // ==========================================
        // VALIDAR QUE SE HAYAN CONSTRUIDO ITEMS
        // ==========================================
        if (itemsPago.length === 0) {

            return res.status(400).json({
                ok: false,
                message:
                    "No se encontraron items válidos"
            });

        }

        // ==========================================
        // CREAR PAGO
        // ==========================================
        const pago = new Pago({

            usuario,

            items: itemsPago,

            metodoPago,

            referenciaTransferencia:
                referenciaTransferencia || null,

            comprobante:
                comprobante || null,

            notas:
                notas || null,

            estado: "pendiente"

        });

        // ==========================================
        // APLICAR CUPÓN
        // ==========================================
        if (codigoCupon) {

            const cupon =
                await Cupon.findOne({
                    codigo:
                        codigoCupon.toUpperCase()
                });

            if (!cupon) {

                return res.status(404).json({
                    ok: false,
                    message: "Cupón inválido"
                });

            }

            const ahora = new Date();

            // ======================================
            // ACTIVO
            // ======================================
            if (!cupon.activo) {

                return res.status(400).json({
                    ok: false,
                    message: "Cupón inactivo"
                });

            }

            // ======================================
            // USOS DISPONIBLES
            // ======================================
            if (cupon.usos <= 0) {

                return res.status(400).json({
                    ok: false,
                    message: "Cupón agotado"
                });

            }

            // ======================================
            // FECHAS
            // ======================================
            if (
                ahora < cupon.fechaInicio ||
                ahora > cupon.fechaFin
            ) {

                return res.status(400).json({
                    ok: false,
                    message: "Cupón expirado"
                });

            }

            // ======================================
            // VALIDAR APLICACIÓN
            // ======================================
            const aplica =
                itemsPago.some(
                    (item) =>
                        item.tipo === cupon.aplica
                );

            if (!aplica) {

                return res.status(400).json({
                    ok: false,
                    message:
                        "El cupón no aplica para este pago"
                });

            }

            // ======================================
            // GUARDAR CUPÓN
            // ======================================
            pago.cupon =
                cupon._id;

            pago.tipoDescuento =
                cupon.descuento;

            pago.valorDescuento =
                cupon.cantidad;

        }

        // ==========================================
        // GUARDAR PAGO
        // ==========================================
        await pago.save();

        // ==========================================
        // CORREO AL ALUMNO
        // ==========================================

        if (usuarioExiste.email) {

            await enviarCorreo(
                usuarioExiste.email,
                "Pago recibido - Pole Project",
                `
        <h2>Hola ${usuarioExiste.nombre}</h2>

        <p>Hemos recibido tu comprobante de pago.</p>

        <p>
            Tu solicitud está pendiente de validación
            por un administrador.
        </p>

        <p>
            Folio:
            <strong>${pago._id}</strong>
        </p>
        `
            );

        }

        // ==========================================
        // CORREO A ADMINISTRADORES
        // ==========================================

        await notificarAdministradores(
            "Nuevo pago pendiente de validación",
            `
    <h2>Nuevo pago recibido</h2>

    <p>
        <b>Alumno:</b>
        ${usuarioExiste.nombre}
    </p>

    <p>
        <b>Email:</b>
        ${usuarioExiste.email}
    </p>

    <p>
        <b>Método:</b>
        ${metodoPago}
    </p>

    <p>
        <b>Folio:</b>
        ${pago._id}
    </p>
    `
        );

        // ==========================================
        // RESPONSE
        // ==========================================
        res.status(201).json({
            ok: true,
            message:
                "Pago creado y pendiente de validación",
            data: pago
        });
    } catch (error) {

        console.error(
            "ERROR CREAR PAGO:",
            error
        );

        res.status(400).json({

            ok: false,

            message:
                error.message

        });

    }

};
// ======================================================

// ======================================================
// 🔥 OBTENER PAGOS
// ======================================================
export const getPagos = async (req, res) => {

    try {

        const filters = {};

        // ==========================================
        // FILTRO POR USUARIO
        // ==========================================
        if (req.query.usuario) {

            filters.usuario =
                req.query.usuario;

        }

        // ==========================================
        // FILTRO POR ESTADO
        // ==========================================
        if (req.query.estado) {

            filters.estado =
                req.query.estado;

        }

        // ==========================================
        // FILTRO POR MÉTODO DE PAGO
        // ==========================================
        if (req.query.metodoPago) {

            filters.metodoPago =
                req.query.metodoPago;

        }

        // ==========================================
        // FILTRO POR FECHAS
        // ==========================================
        if (
            req.query.fechaInicio ||
            req.query.fechaFin
        ) {

            filters.createdAt = {};

            // ======================================
            // FECHA INICIAL
            // ======================================
            if (req.query.fechaInicio) {

                const fechaInicio =
                    new Date(
                        req.query.fechaInicio
                    );

                fechaInicio.setHours(
                    0,
                    0,
                    0,
                    0
                );

                filters.createdAt.$gte =
                    fechaInicio;

            }

            // ======================================
            // FECHA FINAL
            // ======================================
            if (req.query.fechaFin) {

                const fechaFin =
                    new Date(
                        req.query.fechaFin
                    );

                fechaFin.setHours(
                    23,
                    59,
                    59,
                    999
                );

                filters.createdAt.$lte =
                    fechaFin;

            }

        }

        // ==========================================
        // BUSCAR PAGOS
        // ==========================================
        const pagos =
            await Pago.find(filters)

                .populate(
                    "usuario",
                    "nombre apellidos email rol"
                )

                .populate(
                    "recibidoPor",
                    "nombre apellidos rol"
                )

                .populate(
                    "canceladoPor",
                    "nombre apellidos rol"
                )

                .populate("cupon")

                .populate({
                    path: "items.referencia",
                    select:
                        "nombre precio descripcion"
                })

                .sort({
                    createdAt: -1
                });

        // ==========================================
        // RESPONSE
        // ==========================================
        res.json({

            ok: true,

            data: pagos

        });

    } catch (error) {

        console.error(
            "ERROR OBTENER PAGOS:",
            error
        );

        res.status(400).json({

            ok: false,

            message:
                error.message

        });

    }

};


// ======================================================
// 🔥 OBTENER PAGO POR ID
// ======================================================
export const getPagoById = async (req, res) => {

    try {

        // ==========================================
        // BUSCAR PAGO
        // ==========================================
        const pago =
            await Pago.findById(
                req.params.id
            )

                .populate(
                    "usuario",
                    "nombre apellidos email rol"
                )

                .populate(
                    "recibidoPor",
                    "nombre apellidos rol"
                )

                .populate(
                    "canceladoPor",
                    "nombre apellidos rol"
                )

                .populate("cupon")

                .populate({
                    path: "items.referencia",
                    select:
                        "nombre precio descripcion"
                });

        // ==========================================
        // VALIDAR EXISTENCIA
        // ==========================================
        if (!pago) {

            return res.status(404).json({

                ok: false,

                message:
                    "Pago no encontrado"

            });

        }

        // ==========================================
        // RESPONSE
        // ==========================================
        res.json({

            ok: true,

            data: pago

        });

    } catch (error) {

        console.error(
            "ERROR OBTENER PAGO:",
            error
        );

        res.status(400).json({

            ok: false,

            message:
                error.message

        });

    }

};
// 🔥 VALIDAR PAGO
// SOLO ADMIN / MAESTRO
// ======================================================
export const validarPago = async (req, res) => {

    try {

        const pago = await Pago.findById(
            req.params.id
        );

        // ==========================================
        // VALIDAR PAGO
        // ==========================================
        if (!pago) {

            return res.status(404).json({
                ok: false,
                message: "Pago no encontrado"
            });

        }

        // ==========================================
        // SOLO PAGOS PENDIENTES
        // ==========================================
        if (pago.estado !== "pendiente") {

            return res.status(400).json({
                ok: false,
                message:
                    `El pago no puede validarse porque su estado actual es "${pago.estado}"`
            });

        }

        // ==========================================
        // VALIDAR USUARIO
        // ==========================================
        const usuario = await User.findById(
            pago.usuario
        );

        if (!usuario) {

            return res.status(404).json({
                ok: false,
                message: "Usuario del pago no encontrado"
            });

        }

        // ==========================================
        // VALIDAR CUPÓN
        // ==========================================
        let cupon = null;

        if (pago.cupon) {

            cupon = await Cupon.findById(
                pago.cupon
            );

            if (!cupon) {

                return res.status(400).json({
                    ok: false,
                    message:
                        "El cupón asociado al pago ya no existe"
                });

            }

            if (!cupon.activo) {

                return res.status(400).json({
                    ok: false,
                    message:
                        "El cupón asociado al pago está inactivo"
                });

            }

            if (cupon.usos <= 0) {

                return res.status(400).json({
                    ok: false,
                    message:
                        "El cupón ya no tiene usos disponibles"
                });

            }

        }

        // ==========================================
        // VALIDAR STOCK DE PRODUCTOS
        // ANTES DE MODIFICAR NADA
        // ==========================================
        for (const item of pago.items) {

            if (item.tipo !== "producto") {
                continue;
            }

            const producto =
                await Producto.findById(
                    item.referencia
                );

            if (!producto) {

                return res.status(404).json({
                    ok: false,
                    message:
                        `El producto "${item.nombre}" ya no existe`
                });

            }

            if (
                producto.cantidad <
                item.cantidad
            ) {

                return res.status(400).json({
                    ok: false,
                    message:
                        `Stock insuficiente para ${producto.nombre}`
                });

            }

        }

        // ==========================================
        // VALIDAR PLANES
        // ==========================================
        for (const item of pago.items) {

            if (item.tipo !== "plan") {
                continue;
            }

            const plan =
                await Plan.findById(
                    item.referencia
                );

            if (!plan) {

                return res.status(404).json({
                    ok: false,
                    message:
                        `El plan "${item.nombre}" ya no existe`
                });

            }

        }


        // ==========================================
        // 🔥 CAMBIAR ESTADO DEL PAGO
        // ==========================================
        pago.estado = "pagado";

        pago.recibidoPor =
            req.user?._id || req.user?.id || null;

        pago.fechaPago =
            new Date();

        await pago.save();

        // ==========================================
        // ACTUALIZAR PRODUCTOS
        // ==========================================
        for (const item of pago.items) {

            if (item.tipo !== "producto") {
                continue;
            }

            const producto =
                await Producto.findById(
                    item.referencia
                );

            if (!producto) {
                continue;
            }

            producto.cantidad -=
                item.cantidad;

            producto.vendidos =
                (producto.vendidos || 0) +
                item.cantidad;

            // ======================================
            // ACTUALIZAR ESTADO
            // ======================================
            if (producto.cantidad <= 0) {

                producto.cantidad = 0;

                producto.estado =
                    "agotado";

            } else {

                producto.estado =
                    "disponible";

            }

            await producto.save();

        }

        // ==========================================
        // 🔥 CONSUMIR CUPÓN
        // ==========================================
        if (cupon) {

            cupon.usos -= 1;

            if (cupon.usos <= 0) {

                cupon.usos = 0;

            }

            await cupon.save();

            pago.cuponAplicado = true;

            await pago.save();

        }

        // ==========================================
        // 🔥 CREAR USUARIO-PLAN
        // ==========================================
        for (const item of pago.items) {

            if (item.tipo !== "plan") {
                continue;
            }

            const plan =
                await Plan.findById(
                    item.referencia
                );

            if (!plan) {
                continue;
            }

            // ======================================
            // FECHA INICIO
            // ======================================
            const fechaInicio =
                new Date();

            // ======================================
            // FECHA VENCIMIENTO
            // ======================================
            const fechaVencimiento =
                new Date(fechaInicio);

            fechaVencimiento.setDate(
                fechaVencimiento.getDate() +
                plan.duracion
            );

            // ======================================
            // CREAR USUARIO PLAN
            // ======================================
            const usuarioPlan = await UsuarioPlan.create({
                usuario: pago.usuario,
                plan: plan._id,
                clasesTotales: plan.clases === -1 ? -1 : plan.clases,
                clasesUsadas: 0,
                fechaInicio,
                fechaVencimiento,
                activo: true
            });

            pago.usuarioPlanes = pago.usuarioPlanes || [];
            pago.usuarioPlanes.push(usuarioPlan._id);
        }
        await pago.save();

        // ==========================================
        // RESPONSE
        // ==========================================
        const pagoActualizado =
            await Pago.findById(
                pago._id
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

        // ==========================================
        // ENVIAR CORREO DE PAGO APROBADO
        // ==========================================
        try {

            if (usuario.email) {

                await enviarCorreo(
                    usuario.email,
                    "Pago aprobado - Pole Project",
                    `
            <h2>✅ Pago aprobado</h2>

            <p>Hola ${usuario.nombre}</p>

            <p>
                Tu pago ha sido validado correctamente.
            </p>

            <p>
                Folio:
                <strong>${pago._id}</strong>
            </p>

            <p>
                Ya puedes utilizar los servicios
                asociados a tu compra.
            </p>
            `
                );

            }

        } catch (error) {

            console.error(
                "Error enviando correo de aprobación:",
                error.message
            );

        }
        res.json({

            ok: true,

            message:
                "Pago validado correctamente",

            data:
                pagoActualizado

        });

    } catch (error) {

        console.error(
            "ERROR VALIDAR PAGO:",
            error
        );

        res.status(400).json({

            ok: false,

            message:
                error.message

        });

    }

};
// ======================================================
// 🔥 CANCELAR PAGO
// ======================================================
export const cancelarPago = async (req, res) => {

    try {

        // ==========================================
        // BUSCAR PAGO
        // ==========================================
        const pago =
            await Pago.findById(
                req.params.id
            );

        if (!pago) {

            return res.status(404).json({

                ok: false,

                message:
                    "Pago no encontrado"

            });

        }

        // ==========================================
        // VALIDAR ESTADO
        // ==========================================
        if (pago.estado === "cancelado") {

            return res.status(400).json({

                ok: false,

                message:
                    "El pago ya está cancelado"

            });

        }

        // ==========================================
        // GUARDAR ESTADO ANTERIOR
        // ==========================================
        const estadoAnterior =
            pago.estado;

        // ==========================================
        // 🔥 DEVOLVER CUPÓN
        // SOLO SI EL PAGO YA HABÍA SIDO PAGADO
        // ==========================================
        if (
            estadoAnterior === "pagado" &&
            pago.cupon &&
            pago.cuponAplicado
        ) {

            const cupon =
                await Cupon.findById(
                    pago.cupon
                );

            if (cupon) {

                cupon.usos += 1;

                await cupon.save();

            }

        }

        // ==========================================
        // 🔥 DESACTIVAR USUARIO-PLAN
        // SOLO SI EL PAGO ESTABA PAGADO
        // ==========================================
        if (
            estadoAnterior === "pagado" &&
            pago.usuarioPlanes?.length
        ) {
            await UsuarioPlan.updateMany(
                {
                    _id: {
                        $in: pago.usuarioPlanes
                    }
                },
                {
                    activo: false
                }
            );
        }
        // ==========================================
        // 🔥 DEVOLVER STOCK
        // SOLO SI EL PAGO ESTABA PAGADO
        // ==========================================
        if (estadoAnterior === "pagado") {

            for (const item of pago.items) {

                if (item.tipo !== "producto") {
                    continue;
                }

                const producto =
                    await Producto.findById(
                        item.referencia
                    );

                if (!producto) {
                    continue;
                }

                // ==================================
                // DEVOLVER STOCK
                // ==================================
                producto.cantidad +=
                    item.cantidad;

                // ==================================
                // DEVOLVER VENTAS
                // ==================================
                producto.vendidos =
                    Math.max(
                        (producto.vendidos || 0) -
                        item.cantidad,
                        0
                    );

                // ==================================
                // ACTUALIZAR ESTADO
                // ==================================
                if (
                    producto.cantidad > 0
                ) {

                    producto.estado =
                        "disponible";

                }

                await producto.save();

            }

        }

        // ==========================================
        // 🔥 CAMBIAR ESTADO DEL PAGO
        // ==========================================
        pago.estado =
            "cancelado";

        // ==========================================
        // USUARIO QUE CANCELÓ
        // ==========================================
        pago.canceladoPor =
            req.user?._id ||
            req.user?.id ||
            null;

        // ==========================================
        // FECHA DE CANCELACIÓN
        // ==========================================
        pago.fechaCancelacion =
            new Date();

        // ==========================================
        // MOTIVO
        // ==========================================
        if (req.body?.motivoCancelacion) {

            pago.motivoCancelacion =
                req.body.motivoCancelacion;

        }

        // ==========================================
        // GUARDAR
        // ==========================================
        await pago.save();
        // ==========================================
        // NOTIFICAR CANCELACIÓN DE PAGO
        // ==========================================
        try {

            const usuario = await User.findById(
                pago.usuario
            );

            if (usuario?.email) {

                await enviarCorreo(
                    usuario.email,
                    "Pago cancelado - Pole Project",
                    `
            <h2>❌ Pago cancelado</h2>

            <p>Hola ${usuario.nombre}</p>

            <p>
                Tu pago fue cancelado por un administrador.
            </p>

            <p>
                Folio:
                <strong>${pago._id}</strong>
            </p>

            ${pago.motivoCancelacion
                        ? `
                    <p>
                        <strong>Motivo:</strong>
                        ${pago.motivoCancelacion}
                    </p>
                    `
                        : ""
                    }
            `
                );

            }

        } catch (error) {

            console.error(
                "Error enviando correo de cancelación:",
                error.message
            );

        }

        // ==========================================
        // RESPONSE
        // ==========================================
        res.json({

            ok: true,

            message:
                "Pago cancelado correctamente",

            data: pago

        });

    } catch (error) {

        console.error(
            "ERROR CANCELAR PAGO:",
            error
        );

        res.status(400).json({

            ok: false,

            message:
                error.message

        });

    }

};
// ======================================================
// 🔥 ELIMINAR PAGO
// ======================================================
export const eliminarPago = async (req, res) => {

    try {

        // ==========================================
        // BUSCAR PAGO
        // ==========================================
        const pago =
            await Pago.findById(
                req.params.id
            );

        if (!pago) {

            return res.status(404).json({

                ok: false,

                message:
                    "Pago no encontrado"

            });

        }

        // ==========================================
        // GUARDAR ESTADO
        // ==========================================
        const estadoAnterior =
            pago.estado;

        // ==========================================
        // DEVOLVER STOCK
        // SOLO SI ESTABA PAGADO
        // ==========================================
        if (estadoAnterior === "pagado") {

            for (const item of pago.items) {

                if (item.tipo !== "producto") {
                    continue;
                }

                const producto =
                    await Producto.findById(
                        item.referencia
                    );

                if (!producto) {
                    continue;
                }

                // ==================================
                // DEVOLVER CANTIDAD
                // ==================================
                producto.cantidad +=
                    item.cantidad;

                // ==================================
                // DEVOLVER VENTAS
                // ==================================
                producto.vendidos =
                    Math.max(
                        (producto.vendidos || 0) -
                        item.cantidad,
                        0
                    );

                // ==================================
                // ACTUALIZAR ESTADO
                // ==================================
                if (
                    producto.cantidad > 0
                ) {

                    producto.estado =
                        "disponible";

                }

                await producto.save();

            }

        }

        // ==========================================
        // DEVOLVER USO DEL CUPÓN
        // ==========================================
        if (
            estadoAnterior === "pagado" &&
            pago.cupon &&
            pago.cuponAplicado
        ) {

            const cupon =
                await Cupon.findById(
                    pago.cupon
                );

            if (cupon) {

                cupon.usos += 1;

                await cupon.save();

            }

        }

        // ==========================================
        // DESACTIVAR USUARIO-PLAN
        // ==========================================
        if (
            estadoAnterior === "pagado" &&
            pago.usuarioPlanes?.length
        ) {
            await UsuarioPlan.updateMany(
                {
                    _id: {
                        $in: pago.usuarioPlanes
                    }
                },
                {
                    activo: false
                }
            );
        }

        // ==========================================
        // ELIMINAR PAGO
        // ==========================================
        await pago.deleteOne();

        // ==========================================
        // RESPONSE
        // ==========================================
        res.json({

            ok: true,

            message:
                "Pago eliminado correctamente"

        });

    } catch (error) {

        console.error(
            "ERROR ELIMINAR PAGO:",
            error
        );

        res.status(400).json({

            ok: false,

            message:
                error.message

        });

    }

};


// ======================================================
// 🔥 RESUMEN DE PAGOS
// ======================================================
export const getResumenPagos = async (req, res) => {

    try {

        const filters = {
            estado: "pagado"
        };

        // ==========================================
        // FILTRO POR FECHAS
        // ==========================================
        if (
            req.query.fechaInicio ||
            req.query.fechaFin
        ) {

            filters.fechaPago = {};

            // ======================================
            // FECHA INICIAL
            // ======================================
            if (req.query.fechaInicio) {

                const fechaInicio =
                    new Date(
                        req.query.fechaInicio
                    );

                fechaInicio.setHours(
                    0,
                    0,
                    0,
                    0
                );

                filters.fechaPago.$gte =
                    fechaInicio;

            }

            // ======================================
            // FECHA FINAL
            // ======================================
            if (req.query.fechaFin) {

                const fechaFin =
                    new Date(
                        req.query.fechaFin
                    );

                fechaFin.setHours(
                    23,
                    59,
                    59,
                    999
                );

                filters.fechaPago.$lte =
                    fechaFin;

            }

        }

        // ==========================================
        // INGRESOS GENERALES
        // ==========================================
        const resumenGeneral =
            await Pago.aggregate([

                {
                    $match:
                        filters
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

        // ==========================================
        // INGRESOS POR TIPO
        // ==========================================
        const ingresosPorTipo =
            await Pago.aggregate([

                {
                    $match:
                        filters
                },

                {
                    $unwind:
                        "$items"
                },

                {
                    $group: {

                        _id:
                            "$items.tipo",

                        total: {
                            $sum:
                                "$items.subtotal"
                        }

                    }

                }

            ]);

        // ==========================================
        // INGRESOS POR MÉTODO DE PAGO
        // ==========================================
        const ingresosPorMetodoPago =
            await Pago.aggregate([

                {
                    $match:
                        filters
                },

                {
                    $group: {

                        _id:
                            "$metodoPago",

                        total: {
                            $sum:
                                "$total"
                        },

                        cantidad: {
                            $sum: 1
                        }

                    }

                }

            ]);

        // ==========================================
        // USUARIOS QUE PAGARON
        // ==========================================
        const usuariosPagaron =
            await Pago.distinct(
                "usuario",
                filters
            );

        // ==========================================
        // USUARIOS QUE COMPRARON PLAN
        // ==========================================
        const usuariosConPlan =
            await Pago.distinct(

                "usuario",

                {
                    ...filters,

                    "items.tipo":
                        "plan"
                }

            );

        // ==========================================
        // FORMATEAR INGRESOS POR TIPO
        // ==========================================
        const tipos = {
            producto: 0,
            plan: 0
        };

        ingresosPorTipo.forEach(
            (item) => {

                if (
                    Object.prototype.hasOwnProperty
                        .call(
                            tipos,
                            item._id
                        )
                ) {

                    tipos[item._id] =
                        item.total;

                }

            }
        );

        // ==========================================
        // FORMATEAR MÉTODOS
        // ==========================================
        const metodosPago = {};

        ingresosPorMetodoPago.forEach(
            (item) => {

                metodosPago[item._id] = {

                    total:
                        item.total,

                    cantidad:
                        item.cantidad

                };

            }
        );

        // ==========================================
        // RESPONSE
        // ==========================================
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

                ingresosPorTipo:
                    tipos,

                ingresosPorMetodoPago:
                    metodosPago

            }

        });

    } catch (error) {

        console.error(
            "ERROR RESUMEN PAGOS:",
            error
        );

        res.status(400).json({

            ok: false,

            message:
                error.message

        });

    }

};


// ======================================================
// 🔥 REACTIVAR PAGO
// SOLO ADMIN / MAESTRO
// ======================================================
export const reactivarPago = async (req, res) => {

    try {

        // ==========================================
        // BUSCAR PAGO
        // ==========================================
        const pago =
            await Pago.findById(
                req.params.id
            );

        if (!pago) {

            return res.status(404).json({

                ok: false,

                message:
                    "Pago no encontrado"

            });

        }

        // ==========================================
        // SOLO CANCELADOS
        // ==========================================
        if (
            pago.estado !== "cancelado"
        ) {

            return res.status(400).json({

                ok: false,

                message:
                    "Solo los pagos cancelados pueden reactivarse"

            });

        }

        // ==========================================
        // CAMBIAR A PENDIENTE
        // ==========================================
        pago.estado =
            "pendiente";

        // ==========================================
        // LIMPIAR DATOS DE CANCELACIÓN
        // ==========================================
        pago.canceladoPor =
            null;

        pago.fechaCancelacion =
            null;

        pago.motivoCancelacion =
            null;

        // ==========================================
        // LIMPIAR VALIDACIÓN
        // ==========================================
        pago.recibidoPor =
            null;

        pago.fechaPago =
            null;

        // ==========================================
        // EL CUPÓN VUELVE A ESTAR DISPONIBLE
        // PERO NO SE CONSUME HASTA VALIDAR
        // ==========================================
        pago.cuponAplicado =
            false;

        await pago.save();

        // ==========================================
        // RESPONSE
        // ==========================================
        res.json({

            ok: true,

            message:
                "Pago reactivado correctamente",

            data:
                pago

        });

    } catch (error) {

        console.error(
            "ERROR REACTIVAR PAGO:",
            error
        );

        res.status(400).json({

            ok: false,

            message:
                error.message

        });

    }

};