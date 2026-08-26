import mongoose from "mongoose";

// ======================================================
// ITEMS DEL PAGO
// ======================================================
const pagoItemSchema = new mongoose.Schema(
    {
        tipo: {
            type: String,
            enum: ["plan", "producto"],
            required: true
        },

        referencia: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: "items.tipoModelo"
        },

        tipoModelo: {
            type: String,
            enum: ["Plan", "Producto"],
            required: true
        },

        nombre: {
            type: String,
            required: true
        },

        cantidad: {
            type: Number,
            default: 1,
            min: 1
        },

        precioUnitario: {
            type: Number,
            required: true,
            min: 0
        },

        subtotal: {
            type: Number,
            required: true,
            min: 0
        },

        // ======================================
        // DATOS EXTRA PARA PLANES
        // (Se guardan para mantener el histórico
        // aunque el plan cambie en el futuro)
        // ======================================
        clasesIncluidas: {
            type: Number,
            default: null
        },

        duracionDias: {
            type: Number,
            default: null
        },

        // ======================================
        // DATOS EXTRA PARA CLASES
        // ======================================
        instructor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Usuario",
            default: null
        },

        fecha: {
            type: Date,
            default: null
        },

        hora: {
            type: String,
            default: null
        }
    },
    {
        _id: true
    }
);

// ======================================================
// PAGOS
// ======================================================
const pagoSchema = new mongoose.Schema(
    {
        // ======================================
        // USUARIO
        // ======================================
        usuario: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Usuario",
            required: true
        },
        usuarioPlanes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "UsuarioPlan"
            }
        ],
        // ======================================
        // ITEMS
        // ======================================
        items: [pagoItemSchema],

        // ======================================
        // CUPÓN
        // ======================================
        cupon: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Cupon",
            default: null
        },

        tipoDescuento: {
            type: String,
            enum: ["porcentaje", "fijo", null],
            default: null
        },

        valorDescuento: {
            type: Number,
            default: 0
        },

        descuentoAplicado: {
            type: Number,
            default: 0
        },

        // ======================================
        // CONTROL CUPÓN
        // ======================================
        cuponAplicado: {
            type: Boolean,
            default: false
        },

        // ======================================
        // TOTALES
        // ======================================
        subtotal: {
            type: Number,
            required: true,
            min: 0,
            default: 0
        },

        total: {
            type: Number,
            required: true,
            min: 0,
            default: 0
        },

        // ======================================
        // MÉTODO DE PAGO
        // ======================================
        metodoPago: {
            type: String,
            enum: [
                "efectivo",
                "transferencia",
                "stripe"
            ],
            required: true
        },

        // ======================================
        // ESTADO
        // ======================================
        estado: {
            type: String,
            enum: [
                "pendiente",
                "pagado",
                "cancelado",
                "reembolsado"
            ],
            default: "pendiente"
        },

        // ======================================
        // STRIPE
        // ======================================
        stripePaymentIntentId: {
            type: String,
            default: null
        },

        stripeSessionId: {
            type: String,
            default: null
        },

        // ======================================
        // TRANSFERENCIA
        // ======================================
        referenciaTransferencia: {
            type: String,
            default: null
        },

        comprobante: {
            type: String,
            default: null
        },

        // ======================================
        // VALIDACIÓN
        // ======================================
        recibidoPor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Usuario",
            default: null
        },

        fechaPago: {
            type: Date,
            default: null
        },

        

        // ======================================
        // CANCELACIÓN
        // ======================================
        canceladoPor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Usuario",
            default: null
        },

        fechaCancelacion: {
            type: Date,
            default: null
        },

        motivoCancelacion: {
            type: String,
            default: null
        },

        // ======================================
        // NOTAS
        // ======================================
        notas: {
            type: String,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

// ======================================================
// CALCULAR TOTALES
// ======================================================
pagoSchema.pre("validate", function () {

    this.subtotal = this.items.reduce(
        (acc, item) => acc + item.subtotal,
        0
    );

    let descuento = 0;

    // ======================================
    // DESCUENTO %
    // ======================================
    if (this.tipoDescuento === "porcentaje") {

        descuento =
            (this.subtotal * this.valorDescuento) / 100;

    }

    // ======================================
    // DESCUENTO FIJO
    // ======================================
    else if (this.tipoDescuento === "fijo") {

        descuento = this.valorDescuento;

    }

    this.descuentoAplicado = descuento;

    this.total = Math.max(
        this.subtotal - descuento,
        0
    );

});

// ======================================================
// APLICAR CUPÓN
// ======================================================
pagoSchema.methods.aplicarCupon = async function (
    cuponDoc
) {

    const ahora = new Date();

    // ======================================
    // ACTIVO
    // ======================================
    if (!cuponDoc.activo) {
        throw new Error("Cupón inactivo");
    }

    // ======================================
    // USOS
    // ======================================
    if (cuponDoc.usos <= 0) {
        throw new Error("Cupón agotado");
    }

    // ======================================
    // FECHAS
    // ======================================
    if (
        ahora < cuponDoc.fechaInicio ||
        ahora > cuponDoc.fechaFin
    ) {
        throw new Error("Cupón expirado");
    }

    // ======================================
    // VALIDAR APLICACIÓN
    // ======================================
    const aplica = this.items.some(
        (item) => item.tipo === cuponDoc.aplica
    );

    if (!aplica) {
        throw new Error(
            "El cupón no aplica para este pago"
        );
    }

    // ======================================
    // GUARDAR CUPÓN
    // ======================================
    this.cupon = cuponDoc._id;
    this.tipoDescuento = cuponDoc.descuento;
    this.valorDescuento = cuponDoc.cantidad;
};

export default mongoose.model(
    "Pago",
    pagoSchema,
    "pagos"
);