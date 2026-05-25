import dotenv from "dotenv";
import { connectDB } from "../config/db.js";
import User from "../models/usuarios.model.js";

dotenv.config();

const test = async () => {
  await connectDB();

  await User.create({
    nombre: "Admin",
    email: "admn@test.com",
    password: "123456",
    rol: "admin",
    telefono:"1234567890",
    direccion:"dir1",
    fechaNacimiento:"2026-04-01"
  });

  console.log("Usuario creado");
  process.exit();
};

test();