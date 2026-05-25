import User from "../models/usuarios.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const loginUser = async ({ email, password }) => {

    // 1. Buscar usuario
    const user = await User.findOne({ email });

    if (!user) {
        throw new Error("Usuario no encontrado");
    }

    // 2. Validar activo
    if (!user.activo) {
        throw new Error("Usuario inactivo");
    }

    // 3. Comparar password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        throw new Error("Credenciales incorrectas");
    }

    // 4. Generar token
    const token = jwt.sign(
        {
            id: user._id,
            rol: user.rol
        },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    );
    const userSafe = {
        _id: user._id,
        nombre: user.nombre,
        email: user.email,
        apellidos: user.apellidos,
        rol: user.rol,
        avatar: user.avatar
    };

    return {
        user: userSafe,
        token
    };
};