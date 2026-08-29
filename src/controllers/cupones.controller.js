import Cupon from "../models/cupones.model.js";

// ✅ Crear cupón
export const createCupon = async (req, res) => {
    try {
        const {
            nombre,
            codigo,
            fechaInicio,
            fechaFin,
            usos,
            descuento,
            aplica,
            cantidad,
            descripcion,
        } = req.body;

        if (
            !nombre ||
            !codigo ||
            !fechaInicio ||
            !fechaFin ||
            usos === undefined ||
            !descuento ||
            !aplica ||
            cantidad === undefined
        ) {
            return res.status(400).json({
                ok: false,
                message: "Faltan campos obligatorios",
            });
        }

        const cupon = await Cupon.create({
            nombre,
            codigo,
            fechaInicio,
            fechaFin,
            usos,
            descuento,
            aplica,
            cantidad,
            descripcion,
        });

        res.status(201).json({
            ok: true,
            data: cupon,
        });
    } catch (error) {
        res.status(400).json({
            ok: false,
            message: error.message,
        });
    }
};

// ✅ Obtener todos
export const getCupones = async (req, res) => {

    try {

        const filters = {};

        const ahora = new Date();

        // =====================================
        // FILTRO ACTIVO
        // =====================================
        if (req.query.activo !== undefined) {

            filters.activo =
                req.query.activo === "true";

        }
        // =====================================
        // FILTRO aplica
        // =====================================
        if (req.query.aplica) {
            filters.aplica = req.query.aplica;
        }
        // =====================================
        // SOLO CUPONES DISPONIBLES
        // =====================================
        if (req.query.disponibles === "true") {

            filters.activo = true;

            // usos disponibles
            filters.usos = {
                $gt: 0
            };

            // fecha válida
            filters.fechaInicio = {
                $lte: ahora
            };

            filters.fechaFin = {
                $gte: ahora
            };

        }

        const cupones = await Cupon.find(filters)
            .sort({ createdAt: -1 });

        res.json({
            ok: true,
            data: cupones
        });

    } catch (error) {

        res.status(400).json({
            ok: false,
            message: error.message
        });

    }

};

// ✅ Obtener por ID
export const getCuponById = async (req, res) => {
    try {
        const cupon = await Cupon.findById(req.params.id);

        if (!cupon) {
            return res.status(404).json({
                ok: false,
                message: "Cupón no encontrado",
            });
        }

        res.json({
            ok: true,
            data: cupon,
        });
    } catch (error) {
        res.status(400).json({
            ok: false,
            message: error.message,
        });
    }
};

// ✅ Actualizar
export const updateCupon = async (req, res) => {
    try {
        const cupon = await Cupon.findById(req.params.id);

        if (!cupon) {
            return res.status(404).json({
                ok: false,
                message: "Cupón no encontrado",
            });
        }

        const updated = await Cupon.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
returnDocument: "after"
}
        );

        res.json({
            ok: true,
            data: updated,
        });
    } catch (error) {
        res.status(400).json({
            ok: false,
            message: error.message,
        });
    }
};

// ✅ Eliminar
export const deleteCupon = async (req, res) => {
    try {
        const cupon = await Cupon.findById(req.params.id);

        if (!cupon) {
            return res.status(404).json({
                ok: false,
                message: "Cupón no encontrado",
            });
        }

        await cupon.deleteOne();

        res.json({
            ok: true,
            message: "Cupón eliminado correctamente",
        });
    } catch (error) {
        res.status(400).json({
            ok: false,
            message: error.message,
        });
    }
};