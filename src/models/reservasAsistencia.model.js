import mongoose from "mongoose";

const reservaAsistenciaSchema = new mongoose.Schema(
  {
    alumno: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      required: true
    },

    clase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clase",
      required: true
    },

    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      required: true
    },

    fecha: {
      type: Date,
      required: true
    },

    hora: {
      type: String, // formato HH:mm
      required: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/
    },

    estado: {
      type: String,
      enum: ["reservado", "asistio", "no_asistio", "cancelado"],
      default: "reservado"
    },

    checkIn: {
      type: Date
    }

  },
  {
    timestamps: true
  }
);

/**
 * 🔒 Evita reservas duplicadas
 * Un alumno no puede reservar la misma clase en la misma fecha y hora
 */
reservaAsistenciaSchema.index(
  { alumno: 1, clase: 1, fecha: 1, hora: 1 },
  { unique: true }
);

/**
 * 🔥 Middleware para validar capacidad antes de guardar
 */
reservaAsistenciaSchema.pre("save", async function () {
  if (!this.isNew) return;

  const Reserva = mongoose.model("ReservaAsistencia");
  const Clase = mongoose.model("Clase");

  const clase = await Clase.findById(this.clase);

  if (!clase) {
    throw new Error("Clase no encontrada");
  }

  const totalReservas = await Reserva.countDocuments({
    clase: this.clase,
    fecha: this.fecha,
    hora: this.hora,
    estado: { $in: ["reservado", "asistio"] }
  });

  if (totalReservas >= clase.capacidad) {
    throw new Error("La clase ya está llena");
  }

  // asignar instructor
  if (!this.instructor) {
    this.instructor = clase.instructor;
  }
});

/**
 * 🔥 Método estático para obtener lista de asistencia
 */
reservaAsistenciaSchema.statics.obtenerLista = function ({
  claseId,
  fecha,
  hora
}) {
  return this.find({
    clase: claseId,
    fecha,
    hora
  })
    .populate("alumno", "nombre apellidos email")
    .populate("instructor", "nombre apellidos")
    .sort({ createdAt: 1 });
};

/**
 * 🔥 Método para marcar asistencia
 */
reservaAsistenciaSchema.methods.marcarAsistencia = function () {
  this.estado = "asistio";
  this.checkIn = new Date();
  return this.save();
};

/**
 * 🔥 Método para marcar falta
 */
reservaAsistenciaSchema.methods.marcarFalta = function () {
  this.estado = "no_asistio";
  return this.save();
};

export default mongoose.model(
  "ReservaAsistencia",
  reservaAsistenciaSchema,
  "reservas_asistencia"
);