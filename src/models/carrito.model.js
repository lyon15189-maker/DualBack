import mongoose from "mongoose";

const carritoItemSchema = new mongoose.Schema(
    {
        producto: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Producto",
            required: true
        },

        nombre: {
            type: String,
            required: true
        },

        imagen: {
            type: String,
            default: ""
        },

        precio: {
            type: Number,
            required: true,
            min: 0
        },

        cantidad: {
            type: Number,
            required: true,
            min: 1,
            default: 1
        },

        talla: {
            type: String,
            default: null
        },

        color: {
            type: String,
            default: null
        },

        subtotal: {
            type: Number,
            default: 0
        }
    },
    {
        _id: true
    }
);

const carritoSchema = new mongoose.Schema(
    {
        usuario: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Usuario",
            required: true,
            unique: true
        },

        items: [carritoItemSchema],

        totalProductos: {
            type: Number,
            default: 0
        },

        subtotal: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

carritoSchema.pre("validate", function () {

    this.items.forEach(item => {
        item.subtotal = item.precio * item.cantidad;
    });

    this.totalProductos = this.items.reduce(
        (acc, item) => acc + item.cantidad,
        0
    );

    this.subtotal = this.items.reduce(
        (acc, item) => acc + item.subtotal,
        0
    );

});

export default mongoose.model(
    "Carrito",
    carritoSchema,
    "carritos"
);