import Membresia from "../models/membresias.model.js";

// ======================================================
// MIS MEMBRESÍAS
// ======================================================
export const misMembresias = async (req, res) => {
    try {

        const membresias = await Membresia.find({
            usuario: req.user._id
        })
            .populate("plan", "nombre clases duracion")
            .populate("pago")
            .sort({ createdAt: -1 });

        res.json({
            ok: true,
            data: membresias
        });

    } catch (error) {

        res.status(400).json({
            ok: false,
            message: error.message
        });

    }
};

// ======================================================
// MEMBRESÍAS POR USUARIO
// ======================================================
export const getMembresiasUsuario = async (req, res) => {

    try {

        const membresias = await Membresia.find({
            usuario: req.params.usuario
        })
            .populate("plan")
            .populate("pago")
            .sort({
                fechaFin: -1
            });

        res.json({
            ok: true,
            data: membresias
        });

    } catch (error) {

        res.status(400).json({
            ok: false,
            message: error.message
        });

    }

};

// ======================================================
// MEMBRESÍA ACTIVA
// ======================================================
export const getMembresiaActiva = async (req, res) => {

    try {

        const hoy = new Date();

        const membresia = await Membresia.findOne({

            usuario: req.params.usuario,

            activa: true,

            fechaInicio: { $lte: hoy },

            fechaFin: { $gte: hoy },

            $or: [
                { clasesDisponibles: { $gt: 0 } },
                { clasesDisponibles: -1 }
            ]

        }).populate("plan");

        res.json({
            ok: true,
            data: membresia
        });

    } catch (error) {

        res.status(400).json({
            ok: false,
            message: error.message
        });

    }

};

// ======================================================
// AGREGAR CLASES
// ======================================================
export const agregarClases = async (req, res) => {

    try {

        const { clases } = req.body;

        if (!clases || clases <= 0) {

            return res.status(400).json({
                ok: false,
                message: "Cantidad inválida"
            });

        }

        const membresia = await Membresia.findById(
            req.params.id
        );

        if (!membresia) {

            return res.status(404).json({
                ok: false,
                message: "Membresía no encontrada"
            });

        }

        if (membresia.clasesDisponibles !== -1) {

            membresia.clasesDisponibles += Number(clases);

            membresia.clasesTotales += Number(clases);

        }

        await membresia.save();

        res.json({
            ok: true,
            message: "Clases agregadas correctamente",
            data: membresia
        });

    } catch (error) {

        res.status(400).json({
            ok: false,
            message: error.message
        });

    }

};

// ======================================================
// EXTENDER VIGENCIA
// ======================================================
export const extenderVigencia = async (req, res) => {

    try {

        const { dias } = req.body;

        if (!dias || dias <= 0) {

            return res.status(400).json({
                ok: false,
                message: "Cantidad de días inválida"
            });

        }

        const membresia = await Membresia.findById(req.params.id);

        if (!membresia) {

            return res.status(404).json({
                ok: false,
                message: "Membresía no encontrada"
            });

        }

        membresia.fechaFin.setDate(
            membresia.fechaFin.getDate() + Number(dias)
        );

        await membresia.save();

        res.json({
            ok: true,
            message: "Vigencia extendida",
            data: membresia
        });

    } catch (error) {

        res.status(400).json({
            ok: false,
            message: error.message
        });

    }

};

// ======================================================
// DESACTIVAR
// ======================================================
export const desactivarMembresia = async (req, res) => {

    try {

        const membresia = await Membresia.findById(req.params.id);

        if (!membresia) {

            return res.status(404).json({
                ok: false,
                message: "No encontrada"
            });

        }

        membresia.activa = false;

        await membresia.save();

        res.json({
            ok: true,
            message: "Membresía desactivada"
        });

    } catch (error) {

        res.status(400).json({
            ok: false,
            message: error.message
        });

    }

};

// ======================================================
// REACTIVAR
// ======================================================
export const reactivarMembresia = async (req, res) => {

    try {

        const membresia = await Membresia.findById(req.params.id);

        if (!membresia) {

            return res.status(404).json({
                ok: false,
                message: "No encontrada"
            });

        }

        membresia.activa = true;

        await membresia.save();

        res.json({
            ok: true,
            message: "Membresía reactivada"
        });

    } catch (error) {

        res.status(400).json({
            ok: false,
            message: error.message
        });

    }

};