import mongoose from "mongoose";

const cuponSchema = new mongoose.Schema(
    {
        nombre: {
            type: String,
            required: true,
            trim: true,
        },
        codigo: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
        },
        fechaInicio: {
            type: Date,
            required: true,
        },
        fechaFin: {
            type: Date,
            required: true,
            validate: {
                validator: function (value) {
                    return value > this.fechaInicio;
                },
                message: "La fecha fin debe ser mayor a la fecha inicio",
            },
        },
        usos: {
            type: Number,
            required: true,
            min: 0, // cuántas veces se puede usar
        },
        descuento: {
            type: String,
            enum: ["porcentaje", "fijo"],
            required: true,
        },
        aplica: {
            type: String,
            enum: ["clase", "plan","producto"],
            required: true,
        },
        cantidad: {
            type: Number,
            required: true, // valor del descuento
            min: 0,
        },
        descripcion: {
            type: String,
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

export default mongoose.model("Cupon", cuponSchema, "cupones");