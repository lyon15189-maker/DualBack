import mongoose from "mongoose";

const reservaAsistenciaSchema = new mongoose.Schema(
  {

    alumno: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      required: true
    },


    // 🔥 Plan que está utilizando el alumno
    usuarioPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UsuarioPlan",
      default: null
    },


    clase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clase",
      required: true
    },


    // El instructor viene desde la clase
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario"
    },


    fecha: {
      type: Date,
      required: true
    },


    hora: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/
    },


    estado: {
      type: String,
      enum: [
        "reservado",
        "asistio",
        "no_asistio",
        "cancelado",
        "cancelado_minimo",
        "cancelado_maestro",
        "cancelado_admin"
      ],
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



// ======================================================
// Evitar reservas duplicadas
// ======================================================
reservaAsistenciaSchema.index(
  {
    alumno: 1,
    clase: 1,
    fecha: 1,
    hora: 1
  },
  {
    unique: true
  }
);



// ======================================================
// Validar capacidad
// ======================================================
reservaAsistenciaSchema.pre("save", async function () {

  if (!this.isNew) return;


  const Reserva =
    mongoose.model("ReservaAsistencia");


  const Clase =
    mongoose.model("Clase");



  const clase =
    await Clase.findById(this.clase);



  if (!clase) {

    throw new Error(
      "Clase no encontrada"
    );

  }



  const totalReservas =
    await Reserva.countDocuments({

      clase: this.clase,

      fecha: this.fecha,

      hora: this.hora,

      estado: {
        $in: [
          "reservado",
          "asistio"
        ]
      }

    });



  if (totalReservas >= clase.capacidad) {

    throw new Error(
      "La clase ya está llena"
    );

  }



  // asignar instructor automáticamente
  if (!this.instructor) {

    this.instructor =
      clase.instructor;

  }


});




// ======================================================
// Obtener lista asistencia
// ======================================================
reservaAsistenciaSchema.statics.obtenerLista =
  function ({
    claseId,
    fecha,
    hora
  }) {

    return this.find({

      clase: claseId,
      fecha,
      hora

    })

      .populate(
        "alumno",
        "nombre apellidos email"
      )

      .populate(
        "instructor",
        "nombre apellidos"
      )

      .populate(
        "usuarioPlan"
      )

      .sort({
        createdAt: 1
      });

  };




// ======================================================
// Marcar asistencia
// ======================================================
reservaAsistenciaSchema.methods.marcarAsistencia =
  function () {

    this.estado = "asistio";

    this.checkIn = new Date();

    return this.save();

  };




// ======================================================
// Marcar falta
// ======================================================
reservaAsistenciaSchema.methods.marcarFalta =
  function () {

    this.estado = "no_asistio";

    return this.save();

  };



export default mongoose.model(
  "ReservaAsistencia",
  reservaAsistenciaSchema,
  "reservas_asistencia"
);