import ReservaAsistencia from "../models/reservasAsistencia.model.js";
import UsuarioPlan from "../models/usuariosPlanes.model.js";
import Clase from "../models/clases.model.js";
import Usuario from "../models/usuarios.model.js";
// ==========================================
// EXTENDER VIGENCIA DEL PLAN 30 DÍAS
// ==========================================
const extenderVigenciaPlan = async (usuarioPlanId) => {

    // console.log("PLAN:", usuarioPlanId);

    const usuarioPlan =
        await UsuarioPlan.findById(usuarioPlanId);

    if (!usuarioPlan) {
        console.log("NO SE ENCONTRO PLAN");
        return;
    }

    // console.log(
    //     "FECHA ANTES:",
    //     usuarioPlan.fechaVencimiento
    // );

    const nuevaFecha =
        new Date(usuarioPlan.fechaVencimiento);

    nuevaFecha.setDate(
        nuevaFecha.getDate() + 30
    );

    usuarioPlan.fechaVencimiento =
        nuevaFecha;

    await usuarioPlan.save();

    console.log(
        "FECHA DESPUES:",
        usuarioPlan.fechaVencimiento
    );
};
const cancelarReservasYExtenderPlan = async (
    reservas,
    nuevoEstado
) => {

    const planesProcesados = new Set();

    for (const reserva of reservas) {

        reserva.estado = nuevoEstado;

        await reserva.save();

        if (
            reserva.usuarioPlan &&
            !planesProcesados.has(
                reserva.usuarioPlan.toString()
            )
        ) {

            await extenderVigenciaPlan(
                reserva.usuarioPlan
            );

            planesProcesados.add(
                reserva.usuarioPlan.toString()
            );
        }
    }
};
// ======================================================
// Cancelar por minimo
// ======================================================
export const cancelarClasePorMinimo = async (req, res) => {
    try {

        const {
            clase,
            fecha,
            hora
        } = req.body;

        const claseInfo = await Clase.findById(clase);

        if (!claseInfo) {
            return res.status(404).json({
                ok: false,
                message: "Clase no encontrada"
            });
        }

        const reservasActivas =
            await ReservaAsistencia.find({
                clase,
                fecha,
                hora,
                estado: "reservado"
            })
                .populate(
                    "alumno",
                    "nombre email"
                );
        // ==========================================
        // EXTENDER VIGENCIA DE LOS PLANES
        // ==========================================

        const planesProcesados = new Set();

        for (const reserva of reservasActivas) {

            if (
                reserva.usuarioPlan &&
                !planesProcesados.has(
                    reserva.usuarioPlan.toString()
                )
            ) {
                // console.log("88 extender");
                await extenderVigenciaPlan(
                    reserva.usuarioPlan
                );

                planesProcesados.add(
                    reserva.usuarioPlan.toString()
                );
            }
        }
        if (
            reservasActivas.length >=
            claseInfo.capacidadMin
        ) {
            return res.status(400).json({
                ok: false,
                message:
                    "La clase cumple el mínimo requerido"
            });
        }

        await cancelarReservasYExtenderPlan(
            reservasActivas,
            "cancelado_minimo"
        );

        return res.json({
            ok: true,
            message:
                "Clase cancelada por no alcanzar el mínimo",
            totalAfectados:
                reservasActivas.length
        });

    } catch (error) {

        res.status(500).json({
            ok: false,
            message: error.message
        });

    }
};
export const cancelarClasePorMaestro = async (
    req,
    res
) => {

    try {

        const {
            clase,
            fecha,
            hora
        } = req.body;

        const reservas =
            await ReservaAsistencia.find({
                clase,
                fecha,
                hora,
                estado: "reservado"
            });

        await cancelarReservasYExtenderPlan(
            reservas,
            "cancelado_maestro"
        );

        return res.json({
            ok: true,
            message:
                "Clase cancelada por maestro",
            totalAfectados:
                reservas.length
        });

    } catch (error) {

        return res.status(500).json({
            ok: false,
            message: error.message
        });

    }
};
export const cancelarClasePorAdmin = async (
    req,
    res
) => {

    try {

        const {
            clase,
            fecha,
            hora
        } = req.body;

        const reservas =
            await ReservaAsistencia.find({
                clase,
                fecha,
                hora,
                estado: "reservado"
            });

        await cancelarReservasYExtenderPlan(
            reservas,
            "cancelado_admin"
        );

        return res.json({
            ok: true,
            message:
                "Clase cancelada por administrador",
            totalAfectados:
                reservas.length
        });

    } catch (error) {

        return res.status(500).json({
            ok: false,
            message: error.message
        });

    }
};
// ======================================================
// CANCELAR RESERVA
// ======================================================
export const cancelarReserva = async (req, res) => {
    try {

        const reserva =
            await ReservaAsistencia.findById(
                req.params.id
            );

        if (!reserva) {
            return res.status(404).json({
                ok: false,
                message: "Reserva no encontrada"
            });
        }

        if (reserva.estado !== "reservado") {
            return res.status(400).json({
                ok: false,
                message: "La reserva ya fue procesada"
            });
        }

        const fechaSolo =
            reserva.fecha.toISOString().split("T")[0];

        const fechaClase = new Date(
            `${fechaSolo}T${reserva.hora}:00`
        );

        const ahora = new Date();

        const diferenciaMinutos =
            (fechaClase.getTime() - ahora.getTime()) /
            (1000 * 60);

        // console.log("176", {
        //     reserva: reserva._id,
        //     fechaBD: reserva.fecha,
        //     horaBD: reserva.hora,
        //     fechaClase,
        //     ahora,
        //     vencida: fechaClase < ahora
        // });


        if (diferenciaMinutos < 60) {
            return res.status(400).json({
                ok: false,
                message:
                    "Solo puedes cancelar con al menos 1 hora de anticipación"
            });
        }

        reserva.estado = "cancelado";

        await reserva.save();

        res.json({
            ok: true,
            message: "Reserva cancelada"
        });

    } catch (error) {

        res.status(400).json({
            ok: false,
            message: error.message
        });

    }
};
// ======================================================
// RESERVAS POR CLASE Y FECHA
// ======================================================
export const getReservasPorClaseFecha = async (req, res) => {
    try {

        const {
            clase,
            fecha,
            hora,
            estado
        } = req.query;

        if (!clase) {
            return res.status(400).json({
                ok: false,
                message: "El id de la clase es requerido"
            });
        }

        const filtros = {
            clase
        };

        if (fecha) {
            filtros.fecha = fecha;
        }

        if (hora) {
            filtros.hora = hora;
        }

        // ==========================================
        // FILTRO POR ESTADO
        // ==========================================
        if (estado) {

            const estados = estado
                .split(",")
                .map(item => item.trim());

            filtros.estado = {
                $in: estados
            };

        } else {

            // ======================================
            // POR DEFECTO SOLO RESERVAS ACTIVAS
            // ======================================
            filtros.estado = {
                $in: [
                    "reservado",
                    "asistio"
                ]
            };

        }

        // ==========================================
        // CONSULTAR RESERVAS
        // ==========================================
        const reservas =
            await ReservaAsistencia.find(filtros)
                .populate(
                    "alumno",
                    "nombre apellidos email telefono"
                )
                .populate(
                    "clase",
                    "nombre"
                )
                .sort({
                    fecha: 1,
                    hora: 1
                });

        // ==========================================
        // RESPONSE
        // ==========================================
        return res.json({
            ok: true,
            total: reservas.length,
            data: reservas
        });

    } catch (error) {

        console.error(
            "ERROR GET RESERVAS POR CLASE:",
            error
        );

        return res.status(500).json({
            ok: false,
            message: error.message
        });

    }
};
// ======================================================
// OBTENER CLASES DISPONIBLES DEL USUARIO
// ======================================================
export const getDisponibilidadClases = async (req, res) => {
    try {
        const usuarioId = req.user.id;
        const hoy = new Date();
        
        // ==========================================
        // BUSCAR PLANES ACTIVOS Y VIGENTES
        // ==========================================
        // console.log("Buscando planes para usuario:", usuarioId);
        const planes = await UsuarioPlan.find({
            usuario: usuarioId,
            activo: true,
            fechaVencimiento: {
                $gte: hoy
            }
        }).populate("plan", "nombre duracion clases");
        // console.log("planes encontrados:", planes.length);

        // ==========================================
        // SI NO TIENE PLANES
        // ==========================================
        if (!planes.length) {
            return res.json({
                ok: true,
                puedeReservar: false,
                ilimitadas: false,
                clasesDisponibles: 0,
                clasesTotales: 0,
                clasesUsadas: 0,
                clasesReservadas: 0,
                planesActivos: 0,
                fechaVencimiento: null,
                planes: []
            });
        }

        let clasesTotales = 0;
        let clasesUsadas = 0;
        let ilimitadas = false;
        let fechaVencimiento = null;

        // ==========================================
        // CALCULAR CLASES DE LOS PLANES
        // ==========================================
        for (const usuarioPlan of planes) {

            if (usuarioPlan.clasesTotales === -1) {
                ilimitadas = true;
            } else {
                clasesTotales += usuarioPlan.clasesTotales;
                clasesUsadas += usuarioPlan.clasesUsadas || 0;
            }

            if (
                !fechaVencimiento ||
                usuarioPlan.fechaVencimiento < fechaVencimiento
            ) {
                fechaVencimiento =
                    usuarioPlan.fechaVencimiento;
            }
        }

        // ==========================================
        // RESERVAS ACTIVAS (APARTAN CUPO)
        // ==========================================
        const clasesReservadas =
            await ReservaAsistencia.countDocuments({
                alumno: usuarioId,
                estado: "reservado",
                usuarioPlan: {
                    $ne: null
                }
            });

        // ==========================================
        // CALCULAR DISPONIBLES
        // ==========================================
        let clasesDisponibles;

        if (ilimitadas) {

            clasesDisponibles = -1;

        } else {

            clasesDisponibles = Math.max(
                clasesTotales -
                clasesUsadas -
                clasesReservadas,
                0
            );

        }

        const usuario = await Usuario.findById(usuarioId)
            .populate("clasesTomadas.clase", "nombre");

        // ==========================================
        // ¿PUEDE RESERVAR?
        // ==========================================
        const puedeReservar =
            ilimitadas ||
            clasesDisponibles > 0;

        // console.log("461", {
        //     usuarioId,
        //     clasesTotales,
        //     clasesUsadas,
        //     clasesReservadas,
        //     clasesDisponibles
        // });
        // ==========================================
        // RESPUESTA
        // ==========================================
        res.json({
            ok: true,
            puedeReservar,
            ilimitadas,
            clasesDisponibles,
            clasesTotales,
            clasesUsadas,
            clasesReservadas,
            planesActivos: planes.length,
            fechaVencimiento,
            clasesTomadas: usuario?.clasesTomadas || [],
            planes: planes.map((p) => ({
                id: p._id,
                plan: p.plan?.nombre || "Plan",
                clasesTotales: p.clasesTotales,
                clasesUsadas: p.clasesUsadas,
                fechaInicio: p.fechaInicio,
                fechaVencimiento: p.fechaVencimiento,
                activo: p.activo
            }))
        });

    } catch (error) {

        console.error(
            "Error obteniendo disponibilidad:",
            error
        );

        res.status(500).json({
            ok: false,
            message:
                "Error al obtener las clases disponibles"
        });

    }
};
// ======================================================
// CREAR RESERVA
// ======================================================
export const createReserva = async (req, res, next) => {
    try {

        const alumno = req.user.id;

        const {
            clase,
            fecha,
            hora
        } = req.body;

        // ======================================
        // BUSCAR PLANES ACTIVOS
        // ======================================

        const planes = await UsuarioPlan.find({
            usuario: alumno,
            activo: true,
            fechaVencimiento: {
                $gte: new Date()
            }
        });

        if (!planes.length) {
            return res.status(400).json({
                ok: false,
                message: "El alumno no tiene un plan activo"
            });
        }

        // ======================================
        // CALCULAR DISPONIBILIDAD
        // ======================================

        let clasesTotales = 0;
        let clasesUsadas = 0;
        let ilimitadas = false;

        for (const plan of planes) {

            if (plan.clasesTotales === -1) {
                ilimitadas = true;
                break;
            }

            clasesTotales += plan.clasesTotales;
            clasesUsadas += (plan.clasesUsadas || 0);
        }

        const reservasActivas =
            await ReservaAsistencia.countDocuments({
                alumno,
                estado: "reservado"
            });

        const clasesDisponibles = ilimitadas
            ? -1
            : clasesTotales -
            clasesUsadas -
            reservasActivas;

        // ======================================
        // VALIDAR DISPONIBILIDAD
        // ======================================

        if (!ilimitadas && clasesDisponibles <= 0) {
            return res.status(400).json({
                ok: false,
                message: "No tienes clases disponibles"
            });
        }

        // ======================================
        // BUSCAR CLASE
        // ======================================

        const claseData = await Clase.findById(clase);

        if (!claseData) {
            return res.status(404).json({
                ok: false,
                message: "Clase no encontrada"
            });
        }

        // ======================================
        // VALIDAR RESERVA EXISTENTE
        // ======================================

        const reservaExistente =
            await ReservaAsistencia.findOne({
                alumno,
                clase,
                fecha,
                hora
            });

        if (reservaExistente) {

            if (
                [
                    "cancelado",
                    "cancelado_minimo",
                    "cancelado_maestro",
                    "cancelado_admin"
                ].includes(
                    reservaExistente.estado
                )
            ) {

                reservaExistente.estado =
                    "reservado";

                await reservaExistente.save();

                return res.json({
                    ok: true,
                    message: "Reserva reactivada",
                    data: reservaExistente
                });
            }

            return res.status(400).json({
                ok: false,
                message:
                    "Ya tienes una reserva para esta clase"
            });
        }

        // ======================================
        // ELEGIR PLAN A UTILIZAR
        // ======================================

        // ======================================
        // ELEGIR PLAN FIFO (PRIMERO EN VENCER)
        // ======================================

        const planesOrdenados = planes.sort(
            (a, b) =>
                new Date(a.fechaVencimiento) -
                new Date(b.fechaVencimiento)
        );

        let usuarioPlan = null;

        for (const plan of planesOrdenados) {

            // Si es ilimitado lo usamos inmediatamente
            if (plan.clasesTotales === -1) {
                usuarioPlan = plan;
                break;
            }

            const reservasPendientes =
                await ReservaAsistencia.countDocuments({
                    usuarioPlan: plan._id,
                    estado: "reservado"
                });

            const disponibles =
                plan.clasesTotales -
                (plan.clasesUsadas || 0) -
                reservasPendientes;

            if (disponibles > 0) {
                usuarioPlan = plan;
                break;
            }
        }

        if (!usuarioPlan) {
            return res.status(400).json({
                ok: false,
                message:
                    "No se encontró un plan disponible para la reserva"
            });
        }

        // ======================================
        // CREAR RESERVA
        // ======================================

        const reserva =
            await ReservaAsistencia.create({

                alumno,

                usuarioPlan:
                    usuarioPlan._id,

                clase,

                instructor:
                    claseData.instructor,

                fecha,

                hora

            });

        // console.log("705 RESERVA CREADA", reserva);
        res.status(201).json({

            ok: true,

            data: reserva

        });

    } catch (error) {

        next(error);

    }
};
// ======================================================
// OBTENER RESERVAS
// ======================================================
export const getReservas = async (req, res) => {


    try {


        const filtros = {};



        // alumno consulta sus reservas
        if (req.user.rol === "alumno") {

            filtros.alumno = req.user.id;

        }



        if (req.query.estado) {

            filtros.estado = req.query.estado;

        }



        const reservas =
            await ReservaAsistencia
                .find(filtros)

                .populate(
                    "alumno",
                    "nombre apellidos email"
                )

                .populate(
                    "clase",
                    "nombre"
                )

                .populate(
                    "instructor",
                    "nombre apellidos"
                )

                .sort({
                    fecha: 1,
                    hora: 1
                });



        res.json({

            ok: true,
            data: reservas

        });



    } catch (error) {

        res.status(400).json({
            ok: false,
            message: error.message
        });

    }

};
// ======================================================
// OBTENER POR ID
// ======================================================
export const getReservaById = async (req, res) => {
    try {
        const reserva =
            await ReservaAsistencia
                .findById(req.params.id)

                .populate("alumno")

                .populate("clase")

                .populate("instructor");



        if (!reserva) {

            return res.status(404).json({
                ok: false,
                message: "Reserva no encontrada"
            });

        }



        res.json({

            ok: true,
            data: reserva

        });



    } catch (error) {

        res.status(400).json({
            ok: false,
            message: error.message
        });

    }

};

// ======================================================
// REACTIVAR RESERVA
// ======================================================
export const reactivarReserva = async (req, res) => {


    try {


        const reserva =
            await ReservaAsistencia.findById(
                req.params.id
            );


        if (!reserva) {

            return res.status(404).json({
                ok: false,
                message: "Reserva no encontrada"
            });

        }



        reserva.estado = "reservado";


        await reserva.save();



        res.json({

            ok: true,
            message: "Reserva reactivada"

        });



    } catch (error) {

        res.status(400).json({
            ok: false,
            message: error.message
        });

    }

};
// ======================================================
// LISTA DE ASISTENCIA
// ======================================================
export const getListaAsistencia = async (req, res) => {
    try {
        const {
            clase,
            fecha,
            hora
        } = req.query;
        const lista =
            await ReservaAsistencia.find({
                clase,
                fecha,
                hora,
                estado: {
                    $ne: "cancelado"
                }
            })
                .populate(
                    "alumno",
                    "nombre apellidos"
                )
                .sort({
                    createdAt: 1
                });
        res.json({

            ok: true,
            data: lista
        });
    } catch (error) {

        res.status(400).json({
            ok: false,
            message: error.message
        });
    }
};
// ======================================================
// MARCAR ASISTENCIA
// ======================================================
export const marcarAsistencia = async (req, res) => {
    try {
        const reserva =
            await ReservaAsistencia.findById(
                req.params.id
            );
        if (!reserva) {
            return res.status(404).json({
                ok: false,
                message: "Reserva no encontrada"
            });
        }
        if (reserva.estado === "asistio") {
            return res.status(400).json({
                ok: false,
                message: "La asistencia ya fue registrada"
            });
        }
        if (reserva.estado === "cancelado") {
            return res.status(400).json({
                ok: false,
                message:
                    "La reserva fue cancelada"
            });
        }
        reserva.estado = "asistio";
        reserva.checkIn = new Date();
        if (reserva.usuarioPlan) {
            await UsuarioPlan.findByIdAndUpdate(
                reserva.usuarioPlan,
                {
                    $inc: {
                        clasesUsadas: 1
                    }
                }
            );
        }
        const claseInfo = await Clase.findById(reserva.clase);
        await Usuario.findByIdAndUpdate(
            reserva.alumno,
            {
                $push: {
                    clasesTomadas: {
                        clase: claseInfo._id,
                        fecha: reserva.fecha,
                        hora: reserva.hora,
                        reserva: reserva._id,
                        fechaTomada: new Date()
                    }
                }
            }
        );
        await reserva.save();
        res.json({

            ok: true,
            message: "Asistencia registrada",
            data: reserva

        });
    } catch (error) {
        res.status(400).json({
            ok: false,
            message: error.message
        });
    }
};
// ======================================================
// MARCAR FALTA
// ======================================================
export const marcarFalta = async (req, res) => {
    try {
        const reserva =
            await ReservaAsistencia.findById(
                req.params.id
            );
        if (!reserva) {
            return res.status(404).json({
                ok: false,
                message: "Reserva no encontrada"
            });
        }

        if (
            reserva.estado === "asistio" ||
            reserva.estado === "no_asistio"
        ) {
            return res.status(400).json({
                ok: false,
                message:
                    "La asistencia ya fue procesada"
            });
        }

        reserva.estado = "no_asistio";
        if (reserva.usuarioPlan) {
            await UsuarioPlan.findByIdAndUpdate(
                reserva.usuarioPlan,
                {
                    $inc: {
                        clasesUsadas: 1
                    }
                }
            );
        }
        await reserva.save();

        res.json({
            ok: true,
            message: "Falta registrada"
        });

    } catch (error) {

        res.status(400).json({
            ok: false,
            message: error.message
        });

    }
};
// ======================================================
// ASISTENCIA MASIVA
// ======================================================
export const marcarAsistenciaMasiva = async (req, res) => {


    try {


        const {
            reservas
        } = req.body;

        // console.log("773", reservas);

        const resultados = [];



        for (const id of reservas) {


            const reserva =
                await ReservaAsistencia.findById(id);



            if (
                reserva &&
                reserva.estado !== "asistio"
            ) {

                reserva.estado = "asistio";
                reserva.checkIn = new Date();
                if (reserva.usuarioPlan) {
                    await UsuarioPlan.findByIdAndUpdate(
                        reserva.usuarioPlan,
                        {
                            $inc: {
                                clasesUsadas: 1
                            }
                        }
                    );
                }
                const claseInfo = await Clase.findById(reserva.clase);
                await Usuario.findByIdAndUpdate(
                    reserva.alumno,
                    {
                        $addToSet: {
                            clasesTomadas: {
                                clase: claseInfo._id,
                                fecha: reserva.fecha,
                                hora: reserva.hora,
                                reserva: reserva._id,
                                fechaTomada: new Date()
                            }
                        }
                    }
                );

                await reserva.save();


                resultados.push(id);

            }

        }



        res.json({

            ok: true,

            message:
                "Asistencias registradas",

            total:
                resultados.length

        });



    } catch (error) {

        res.status(400).json({
            ok: false,
            message: error.message
        });

    }

};
// ======================================================
// ELIMINAR RESERVA
// ======================================================
export const deleteReserva = async (req, res) => {


    try {


        const reserva =
            await ReservaAsistencia.findById(
                req.params.id
            );


        if (!reserva) {

            return res.status(404).json({
                ok: false,
                message: "Reserva no encontrada"
            });

        }



        await reserva.deleteOne();



        res.json({

            ok: true,

            message:
                "Reserva eliminada"

        });



    } catch (error) {

        res.status(400).json({
            ok: false,
            message: error.message
        });

    }

};
