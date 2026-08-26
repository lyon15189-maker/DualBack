import mongoose from "mongoose";

const usuariosPlanesSchema = new mongoose.Schema(
    {
        usuario: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Usuario",
            required: true
        },

        plan: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Plan",
            required: true
        },


        // Cantidad de clases que recibió al comprar el plan
        clasesTotales: {
            type: Number,
            required: true,
            validate: {
                validator(value) {
                    return value === -1 || value >= 0;
                },
                message:
                    "clasesTotales debe ser -1 (ilimitado) o mayor o igual a 0"
            }
        },


        // Clases que ya utilizó en reservas
        clasesUsadas: {
            type: Number,
            default: 0,
            min: 0
        },


        // Fecha en que se activó el plan
        fechaInicio: {
            type: Date,
            default: Date.now
        },


        // Fecha límite para utilizar las clases
        fechaVencimiento: {
            type: Date,
            required: true
        },


        // Permite saber si el plan sigue vigente
        activo: {
            type: Boolean,
            default: true
        }

    },
    {
        timestamps: true
    }
);


// Índice para buscar rápidamente planes activos de un usuario
usuariosPlanesSchema.index({
    usuario: 1,
    activo: 1
});


export default mongoose.model(
    "UsuarioPlan",
    usuariosPlanesSchema
);