import mongoose from 'mongoose';
import bcrypt from "bcryptjs";
const userSchema = new mongoose.Schema({
  avatar: {
    type: String,
    default: ""
  },
  nombre: { type: String, required: true },
  apellidos: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  alerjias: { type: String },
  condiciones: { type: String },
  contactoEmergencia: { type: String },
  lesiones: { type: String },
  medicamento: { type: String },
  notas: { type: String },

  especialidades: Array,

  rol: {
    type: String,
    enum: ['admin', 'maestro', 'alumno', 'cliente'],
    default: 'cliente',
    required: true
  },

  telefono: String,
  direccion: String,

  fechaNacimiento: {
    type: Date,
    validate: {
      validator: (value) => value <= new Date(),
      message: "La fecha no puede ser futura"
    }
  },
  // "1995-08-15"

  activo: { type: Boolean, default: true }

}, { timestamps: true });
// 🔥 middleware antes de guardar
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 10);
});
export default mongoose.model("Usuario", userSchema, "usuarios");