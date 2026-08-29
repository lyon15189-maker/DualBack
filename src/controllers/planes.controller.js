import Plan from "../models/planes.model.js";

// ✅ Crear plan
export const createPlan = async (req, res) => {
    try {
        const { nombre, precio, duracion, clases, descripcion } = req.body;

        if (!nombre || precio === undefined || !duracion || clases === undefined || !descripcion) {
            return res.status(400).json({
                ok: false,
                message: "Faltan campos obligatorios",
            });
        }

        const plan = await Plan.create({
            nombre,
            precio,
            duracion,
            clases,
            descripcion,
        });

        res.status(201).json({
            ok: true,
            data: plan,
        });
    } catch (error) {
        res.status(400).json({
            ok: false,
            message: error.message,
        });
    }
};

// ✅ Obtener todos
export const getPlanes = async (req, res) => {
    try {
        const filters = {};

        if (req.query.activo !== undefined) {
            filters.activo = req.query.activo === "true";
        }

        const planes = await Plan.find(filters);

        res.json({
            ok: true,
            data: planes,
        });
    } catch (error) {
        res.status(400).json({
            ok: false,
            message: error.message,
        });
    }
};

// ✅ Obtener por ID
export const getPlanById = async (req, res) => {
    try {
        const plan = await Plan.findById(req.params.id);

        if (!plan) {
            return res.status(404).json({
                ok: false,
                message: "Plan no encontrado",
            });
        }

        res.json({
            ok: true,
            data: plan,
        });
    } catch (error) {
        res.status(400).json({
            ok: false,
            message: error.message,
        });
    }
};

// ✅ Actualizar
export const updatePlan = async (req, res) => {
    try {
        const plan = await Plan.findById(req.params.id);

        if (!plan) {
            return res.status(404).json({
                ok: false,
                message: "Plan no encontrado",
            });
        }

        const updated = await Plan.findByIdAndUpdate(
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

// ✅ Eliminar (soft delete recomendado)
export const deletePlan = async (req, res) => {
    try {
        const plan = await Plan.findById(req.params.id);

        if (!plan) {
            return res.status(404).json({
                ok: false,
                message: "Plan no encontrado",
            });
        }

        await plan.deleteOne();

        res.json({
            ok: true,
            message: "Plan eliminado correctamente",
        });
    } catch (error) {
        res.status(400).json({
            ok: false,
            message: error.message,
        });
    }
};
