import UsuarioPlan from "../models/usuariosPlanes.model.js";

/**
 * Obtener clases disponibles del usuario autenticado
 */
export const getClasesDisponibles = async (req, res, next) => {
    try {

        const usuarioId = req.user.id;

        const usuarioPlan = await UsuarioPlan.findOne({
            usuario: usuarioId,
            activo: true
        })
        .populate("plan", "nombre precio duracion clases");

        if (!usuarioPlan) {
            return res.status(404).json({
                message: "El usuario no tiene un plan activo"
            });
        }


        const clasesRestantes =
            usuarioPlan.clasesTotales - usuarioPlan.clasesUsadas;


        const fechaActual = new Date();

        const diferenciaTiempo =
            usuarioPlan.fechaVencimiento - fechaActual;


        const diasRestantes = Math.max(
            0,
            Math.ceil(
                diferenciaTiempo / (1000 * 60 * 60 * 24)
            )
        );


        res.json({
            plan: usuarioPlan.plan.nombre,
            clasesTotales: usuarioPlan.clasesTotales,
            clasesUsadas: usuarioPlan.clasesUsadas,
            clasesRestantes,
            fechaInicio: usuarioPlan.fechaInicio,
            fechaVencimiento: usuarioPlan.fechaVencimiento,
            diasRestantes
        });


    } catch (error) {
        next(error);
    }
};



/**
 * Obtener detalle completo del plan activo
 */
export const getDetallePlanUsuario = async (req, res, next) => {
    try {

        const usuarioId = req.user.id;


        const usuarioPlan = await UsuarioPlan.findOne({
            usuario: usuarioId,
            activo: true
        })
        .populate("plan");


        if (!usuarioPlan) {
            return res.status(404).json({
                message: "No existe un plan activo"
            });
        }


        const fechaActual = new Date();


        const diasRestantes = Math.max(
            0,
            Math.ceil(
                (usuarioPlan.fechaVencimiento - fechaActual)
                /
                (1000 * 60 * 60 * 24)
            )
        );


        res.json({

            plan: usuarioPlan.plan,

            clases: {
                totales: usuarioPlan.clasesTotales,
                usadas: usuarioPlan.clasesUsadas,
                disponibles:
                    usuarioPlan.clasesTotales -
                    usuarioPlan.clasesUsadas
            },

            vigencia: {
                inicio: usuarioPlan.fechaInicio,
                vencimiento: usuarioPlan.fechaVencimiento,
                diasRestantes
            },

            activo: usuarioPlan.activo

        });


    } catch(error){
        next(error);
    }
};