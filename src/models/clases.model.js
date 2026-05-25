import mongoose from 'mongoose';

const horarioSchema = new mongoose.Schema({
  dia: {
    type: String,
    enum: [
      "lunes",
      "martes",
      "miercoles",
      "jueves",
      "viernes",
      "sabado",
      "domingo"
    ],
    required: true
  },
  horas: [
    {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/ // HH:mm
    }
  ]
}, { _id: false });

const classSchema = new mongoose.Schema({
  nombre: { type: String, required: true },

  descripcion: String,
  color: String,

  // 🔥 nuevo campo
  horarios: [horarioSchema],

  duracion: {
    type: Number,
    required: true
  },

  capacidad: {
    type: Number,
    required: true
  },

  capacidadMin: {
    type: Number,
    required: true
  },

  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },

  activa: {
    type: Boolean,
    default: true
  }

}, { timestamps: true });

export default mongoose.model("Clase", classSchema, "clases");