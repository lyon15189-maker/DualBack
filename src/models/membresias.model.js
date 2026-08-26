import mongoose from "mongoose";

const membresiaSchema = new mongoose.Schema({

    usuario:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Usuario",
        required:true
    },

    pago:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Pago",
        default:null
    },

    tipo:{
        type:String,
        enum:["plan","clase","ajuste"],
        required:true
    },

    plan:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Plan",
        default:null
    },

    clasesAsignadas:{
        type:Number,
        required:true
    },

    clasesRestantes:{
        type:Number,
        required:true
    },

    fechaInicio:{
        type:Date,
        required:true
    },

    fechaFin:{
        type:Date,
        default:null
    },

    estado:{
        type:String,
        enum:["activa","agotada","vencida"],
        default:"activa"
    }

},{
    timestamps:true
});

export default mongoose.model(
    "Membresia",
    membresiaSchema,
    "membresias"
);