import mongoose from "mongoose";

const productoSchema = new mongoose.Schema(
    {
        nombre: {
            type: String,
            required: true,
            trim: true
        },

        descripcion: {
            type: String,
            required: true,
            trim: true
        },

        categoria: {
            type: [String],
            required: true
        },

        // ✅ Cantidad inicial registrada
        cantidadInicial: {
            type: Number,
            required: true,
            min: 0
        },

        // ✅ Cantidad actual disponible
        cantidad: {
            type: Number,
            required: true,
            min: 0
        },

        // ✅ Productos vendidos
        vendidos: {
            type: Number,
            default: 0,
            min: 0
        },

        // ✅ Estado del producto
        estado: {
            type: String,
            enum: ["disponible", "agotado", "pausado"],
            default: "disponible"
        },

        precio: {
            type: Number,
            required: true,
            min: 0
        },

        precioCompra: {
            type: Number,
            required: true,
            min: 0
        },

        imagen: {
            type: [String],
            required: true
        },

        talla: {
            type: [String],
            default: []
        },

        color: {
            type: [String],
            default: []
        },

        fechaCompra: {
            type: Date,
            required: true
        }
    },
    {
        timestamps: true
    }
);

// ✅ Middleware automático para estado
productoSchema.pre("save", async function () {

    if (this.estado !== "pausado") {

        if (this.cantidad <= 0) {
            this.estado = "agotado";
        } else {
            this.estado = "disponible";
        }

    }

});

export default mongoose.model(
    "Producto",
    productoSchema,
    "productos"
);