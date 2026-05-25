import mongoose from "mongoose";

const planSchema = new mongoose.Schema(
    {
        nombre: {
            type: String,
            required: true,
            trim: true,
        },
        precio: {
            type: Number,
            required: true,
            min: 0,
        },
        duracion: {
            type: Number,
            required: true, // en días (30, 365, etc.)
            min: 1,
        },
        clases: {
            type: Number,
            required: true,
            // -1 = ilimitadas
            validate: {
                validator: (v) => v >= -1,
                message: "Las clases deben ser -1 o mayor",
            },
        },
        descripcion: {
            type: String,
            required: true,
            trim: true,
        },
        activo: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model("Plan", planSchema, "planes");